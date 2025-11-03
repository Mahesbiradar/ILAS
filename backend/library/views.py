# library/views.py
import csv
import io
import os
import zipfile
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction as db_transaction
from django.db.models import Q, Count, F
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound, ValidationError

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from .models import Book, BookCopy, Transaction, AuditLog, TransactionArchive
from .serializers import (
    BookSerializer,
    BookCopySerializer,
    TransactionSerializer,
    TransactionReturnSerializer,
    AuditLogSerializer,
)
from .permissions import IsAdminOrReadOnly
from library.tasks import generate_bulk_barcodes, generate_barcode_pdf, generate_barcode_for_copy
# Optional libs
try:
    import openpyxl
except Exception:
    openpyxl = None


def create_audit(actor, action, target_type=None, target_id=None, payload=None):
    """Safely creates an AuditLog entry without interrupting flow."""
    try:
        AuditLog.objects.create(
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            payload=payload or {},
        )
    except Exception:
        pass


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 200


# ========================================================================
# BOOK VIEWSET
# ========================================================================
class BookViewSet(viewsets.ModelViewSet):
    """
    Handles Book CRUD, Bulk Upload/Delete, and filtering.
    Supports lookup by both ID and book_code.
    """
    queryset = Book.objects.all().order_by("-added_date")
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "author", "isbn", "book_code", "category"]
    ordering_fields = ["title", "author", "quantity", "added_date"]

    lookup_field = "book_code"
    lookup_value_regex = r"[^/]+"

    # ---------------- Safe File Delete ----------------
    def safe_remove(self, file_field):
        try:
            if file_field and hasattr(file_field, "path") and os.path.exists(file_field.path):
                os.remove(file_field.path)
        except Exception:
            pass

    # ---------------- Safe Object Lookup ----------------
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field)
        obj = None
        if str(lookup_value).isdigit():
            obj = queryset.filter(id=int(lookup_value)).first()
        if not obj:
            obj = queryset.filter(book_code=lookup_value).first()
        if not obj:
            raise NotFound(f"Book '{lookup_value}' not found.")
        self.check_object_permissions(self.request, obj)
        return obj

    # ---------------- Filters ----------------
    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search", "").strip()
        if category and category.lower() != "all":
            qs = qs.filter(category__icontains=category)
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(author__icontains=search)
                | Q(isbn__icontains=search)
                | Q(category__icontains=search)
                | Q(book_code__icontains=search)
            )
        return qs

    # ---------------- Create ----------------
    def create(self, request, *args, **kwargs):
        # Use serializer to validate
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book = serializer.save()
        create_audit(request.user, "BOOK_CREATE", "Book", book.book_code, {"title": book.title})
        return Response(BookSerializer(book).data, status=status.HTTP_201_CREATED)

    # ---------------- Update ----------------
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Keep original quantity to detect change
        original_qty = instance.quantity
        data = request.data.copy()

        # sanitize incoming fields (allow empty cover_image removal using null)
        # If client sends "quantity" we handle the copies accordingly
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # If quantity changed, sync copies (increase or decrease)
        try:
            new_qty = int(serializer.validated_data.get("quantity", updated.quantity))
        except Exception:
            new_qty = updated.quantity

        if new_qty != original_qty:
            if new_qty > original_qty:
                # create additional copies
                to_create = new_qty - original_qty
                created_copies = []
                for _ in range(to_create):
                    new_copy = BookCopy.objects.create(book=updated)
                    created_copies.append(new_copy)
                    # placeholder: generate barcode image for new_copy
                    # if you have a task to generate barcode image, call it here:
                    # from library.tasks import generate_barcode_for_copy
                    generate_barcode_for_copy.delay(new_copy.id)
                create_audit(request.user, "BOOK_COPY_CREATE", "Book", updated.book_code, {"added": to_create})
            else:
                # decrease copies: delete available copies (preferably those with highest C number)
                to_remove = original_qty - new_qty
                # select copies that are not issued, not lost, sorted by newest or highest C number
                candidates = updated.copies.filter(status__iexact="available").order_by("-created_at")
                removed = 0
                for copy in candidates:
                    if removed >= to_remove:
                        break
                    try:
                        # remove barcode image if exists
                        if copy.barcode_image and hasattr(copy.barcode_image, "path") and os.path.exists(copy.barcode_image.path):
                            os.remove(copy.barcode_image.path)
                    except Exception:
                        pass
                    copy.delete()
                    removed += 1
                # if removed < to_remove, we cannot delete issued copies — raise warning
                if removed < to_remove:
                    # do not rollback book update (quantity already set); just warn in audit
                    create_audit(request.user, "BOOK_COPY_REMOVE_PARTIAL", "Book", updated.book_code, {"requested": to_remove, "removed": removed})
        create_audit(request.user, "BOOK_EDIT", "Book", updated.book_code, {"title": updated.title})
        return Response(BookSerializer(updated).data, status=status.HTTP_200_OK)

    # ---------------- Delete ----------------
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.safe_remove(instance.cover_image)
            for copy in instance.copies.all():
                self.safe_remove(copy.barcode_image)
        except Exception:
            pass
        title, code = instance.title, instance.book_code
        instance.delete()
        create_audit(request.user, "BOOK_DELETE", "Book", code, {"title": title})
        return Response({"message": f"Book '{title}' deleted successfully."}, status=200)

    # ---------------- Bulk Upload ----------------
    @action(detail=False, methods=["post"], url_path="bulk_upload", permission_classes=[IsAdminUser])
    def bulk_upload(self, request):
        excel = request.FILES.get("file")
        images_zip = request.FILES.get("images")

        if not excel:
            return Response({"error": "Excel file required under 'file'."}, status=400)
        if openpyxl is None:
            return Response({"error": "Server missing 'openpyxl'."}, status=500)

        images_map = {}
        if images_zip:
            try:
                with zipfile.ZipFile(images_zip) as z:
                    for name in z.namelist():
                        base = os.path.basename(name)
                        images_map[base.lower()] = z.read(name)
            except zipfile.BadZipFile:
                return Response({"error": "Invalid ZIP file."}, status=400)

        try:
            wb = openpyxl.load_workbook(filename=excel, data_only=True)
            ws = wb.active
        except Exception as e:
            return Response({"error": f"Failed to read Excel: {e}"}, status=400)

        header, created, errors = [], [], []
        for i, row in enumerate(ws.iter_rows(values_only=True), start=1):
            if i == 1:
                header = [str(c).strip().lower() if c else "" for c in row]
                continue

            row_data = {header[j]: (row[j] if j < len(row) else None) for j in range(len(header))}
            title = row_data.get("title") or "Untitled"
            author = row_data.get("author") or "Unknown"
            isbn = str(row_data.get("isbn") or "").strip() or None
            category = row_data.get("category") or ""
            qty = int(row_data.get("quantity") or 1)

            try:
                book = Book.objects.create(title=title, author=author, isbn=isbn, category=category, quantity=qty)
                attached = False
                for nm in [f"{isbn}.jpg", f"{isbn}.png", f"{book.book_code}.jpg", f"{book.book_code}.png", f"{title}.jpg", f"{title}.png"]:
                    if nm.lower() in images_map:
                        book.cover_image.save(nm, ContentFile(images_map[nm.lower()]), save=True)
                        attached = True
                        break
                created.append({"title": book.title, "book_code": book.book_code})
                create_audit(request.user, "BOOK_CREATE", "Book", book.book_code, {"title": book.title})
                # Note: Book.save() creates copies according to quantity. If you need barcode images
                # generated for copies after bulk creation, call your task here to generate barcodes in background:
                # generate_bulk_barcodes.delay([book.book_code])
            except Exception as e:
                errors.append({"row": i, "error": str(e), "title": title})

        return Response({"created": created, "errors": errors}, status=200)

    # ---------------- Bulk Delete ----------------
    @action(detail=False, methods=["post"], url_path="bulk_delete", permission_classes=[IsAdminUser])
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "No book IDs provided."}, status=400)

        qs = Book.objects.none()
        pks = [i for i in ids if str(i).isdigit()]
        codes = [i for i in ids if not str(i).isdigit()]
        if pks:
            qs |= Book.objects.filter(id__in=pks)
        if codes:
            qs |= Book.objects.filter(book_code__in=codes)

        count = qs.count()
        for b in qs:
            self.safe_remove(b.cover_image)
            for c in b.copies.all():
                self.safe_remove(c.barcode_image)
            create_audit(request.user, "BOOK_DELETE", "Book", b.book_code, {"title": b.title})
            b.delete()

        return Response({"message": f"{count} books deleted."}, status=200)


# ========================================================================
# BOOKCOPY VIEWSET (CRUD at copy level)
# ========================================================================
class BookCopyViewSet(viewsets.ModelViewSet):
    """
    Add / Edit / Delete book copies directly.
    - Create: create a single copy for a given book id or book_code.
    - Update: allow partial updates for status, condition, location only.
    - Delete: prevent deleting if copy is issued.
    """
    queryset = BookCopy.objects.select_related("book").all().order_by("-created_at")
    serializer_class = BookCopySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination

    lookup_field = "copy_id"
    lookup_value_regex = r"[^/]+"

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field)
        obj = None
        if str(lookup_value).isdigit():
            obj = queryset.filter(id=int(lookup_value)).first()
        if not obj:
            obj = queryset.filter(copy_id=lookup_value).first()
        if not obj:
            raise NotFound(f"BookCopy '{lookup_value}' not found.")
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        qs = super().get_queryset()
        book_code = self.request.query_params.get("book_code")
        book_id = self.request.query_params.get("book_id")
        status = self.request.query_params.get("status")
        if book_code:
            qs = qs.filter(book__book_code__icontains=book_code)
        if book_id:
            qs = qs.filter(book__id=book_id)
        if status:
            qs = qs.filter(status__iexact=status)
        return qs

    def create(self, request, *args, **kwargs):
        """
        Create a new BookCopy for an existing book. Accepts either:
          - book (book pk)
          - book_code (in data) OR in query param.
        """
        data = request.data.copy()
        book_code = data.get("book_code") or request.query_params.get("book_code")
        book_pk = data.get("book")  # numeric pk

        book = None
        if book_pk:
            try:
                book = Book.objects.get(pk=int(book_pk))
            except Exception:
                raise ValidationError({"book": "Invalid book id"})
        elif book_code:
            try:
                book = Book.objects.get(book_code=book_code)
            except Exception:
                raise ValidationError({"book_code": "Invalid book_code"})

        if not book:
            raise ValidationError({"book": "book (id) or book_code required"})

        # create a copy
        copy = BookCopy.objects.create(book=book)
        # increment book.quantity to keep sync (optional — depends on your policy)
        book.quantity = F("quantity") + 1
        book.save(update_fields=["quantity"])
        # refresh book from db
        book.refresh_from_db()

        # placeholder: generate barcode image (call your async task or local generator)
        generate_barcode_for_copy.delay(copy.id)
        create_audit(request.user, "BOOK_COPY_CREATE", "BookCopy", copy.copy_id, {"book": book.book_code})
        generate_bulk_barcodes.delay([book.book_code])


        return Response(BookCopySerializer(copy).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        """
        Only allow status/condition/location updates.
        """
        instance = self.get_object()
        allowed = {"status", "condition", "location"}
        patch_data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=patch_data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        create_audit(request.user, "BOOK_COPY_EDIT", "BookCopy", updated.copy_id, {"fields": list(patch_data.keys())})
        return Response(BookCopySerializer(updated).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Prevent deletion if the copy is issued
        if instance.status and instance.status.lower() == "issued":
            return Response({"error": "Cannot delete a copy that is currently issued."}, status=400)

        # decrement book.quantity
        book = instance.book
        try:
            if instance.barcode_image and hasattr(instance.barcode_image, "path") and os.path.exists(instance.barcode_image.path):
                os.remove(instance.barcode_image.path)
        except Exception:
            pass
        instance.delete()
        # sync book.quantity but don't go below 0
        if book.quantity and book.quantity > 0:
            book.quantity = F("quantity") - 1
            book.save(update_fields=["quantity"])
            book.refresh_from_db()

        create_audit(request.user, "BOOK_COPY_DELETE", "BookCopy", instance.copy_id, {"book": book.book_code})
        return Response({"message": f"Copy {instance.copy_id} deleted."}, status=200)


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def _csv_response(self, filename, headers, rows):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(headers)
        writer.writerows(rows)
        return response

    def books(self, request):
        books = Book.objects.all().order_by("title")
        headers = ["Book ID", "Title", "Author", "ISBN", "Category", "Quantity", "Available", "Added Date"]
        rows = []
        for b in books:
            rows.append([
                b.book_code,
                b.title,
                b.author or "",
                b.isbn or "",
                b.category or "",
                b.quantity,
                b.copies.filter(status="available").count(),
                timezone.localtime(b.added_date).strftime("%Y-%m-%d %H:%M")
            ])
        return self._csv_response("books_report.csv", headers, rows)

    def copies(self, request):
        copies = BookCopy.objects.select_related("book").all().order_by("copy_id")
        headers = ["Copy ID", "Barcode", "Book Title", "Author", "Status", "Condition", "Location", "Created At"]
        rows = []
        for c in copies:
            rows.append([c.copy_id, c.barcode_value, c.book.title, c.book.author or "", c.status, c.condition, c.location or "", timezone.localtime(c.created_at).strftime("%Y-%m-%d %H:%M")])
        return self._csv_response("copies_report.csv", headers, rows)

class BarcodeReportView(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        """Supports synchronous and asynchronous barcode PDF generation"""
        async_flag = request.query_params.get("async", "false").lower() == "true"
        book_ids_param = request.query_params.get("book_ids")
        copy_ids_param = request.query_params.get("copy_ids")

        if async_flag:
            # handle async mode
            book_ids = []
            if book_ids_param:
                book_ids = [x.strip() for x in book_ids_param.split(",") if x.strip()]
            elif copy_ids_param:
                book_ids = [x.strip() for x in copy_ids_param.split(",") if x.strip()]

            task = generate_bulk_barcodes.delay(book_ids)
            return Response({
                "message": "Task queued for async barcode PDF generation.",
                "task_id": task.id
            }, status=202)

        # fallback → original synchronous code
        if A4 is None:
            return Response({"error": "reportlab not installed"}, status=500)

        copy_id = request.query_params.get("copy_id")
        if copy_id:
            copies = BookCopy.objects.filter(copy_id=copy_id)
        elif copy_ids_param:
            ids = [x.strip() for x in copy_ids_param.split(",") if x.strip()]
            copies = BookCopy.objects.filter(copy_id__in=ids)
        elif book_ids_param:
            book_ids = [b.strip() for b in book_ids_param.split(",") if b.strip()]
            copies = BookCopy.objects.filter(book__book_code__in=book_ids)
        else:
            copies = BookCopy.objects.all()

        if not copies.exists():
            return Response({"message": "No copies found"}, status=404)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        x_margin, y_margin = 15 * mm, 25 * mm
        col_spacing, row_spacing = 65 * mm, 55 * mm
        max_cols, max_rows = 3, 5
        col, row = 0, 0

        for copy in copies:
            if not copy.barcode_image:
                continue
            img_path = os.path.join(settings.MEDIA_ROOT, str(copy.barcode_image))
            if not os.path.exists(img_path):
                continue

            x = x_margin + col * col_spacing
            y = height - y_margin - row * row_spacing
            p.drawImage(ImageReader(img_path), x, y - 20 * mm,
                        width=55 * mm, height=30 * mm,
                        preserveAspectRatio=True, anchor="nw")

            col += 1
            if col >= max_cols:
                col, row = 0, row + 1
                if row >= max_rows:
                    p.showPage()
                    row = 0

        p.save()
        buffer.seek(0)
        fname = "barcodes_sync.pdf"
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{fname}"'
        return response



class BarcodeScanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        barcode_value = request.data.get("barcode_value")
        if not barcode_value:
            return Response({"error": "barcode_value required"}, status=400)
        try:
            copy = BookCopy.objects.select_related("book").get(barcode_value=barcode_value)
        except BookCopy.DoesNotExist:
            return Response({"error": "Invalid barcode"}, status=404)
        data = {
            "copy_id": copy.copy_id,
            "barcode_value": copy.barcode_value,
            "status": copy.status,
            "book_code": copy.book.book_code,
            "book_pk": copy.book.id,
            "book_title": copy.book.title,
            "author": copy.book.author,
            "category": copy.book.category,
            "location": copy.location,
            "condition": copy.condition,
        }
        return Response(data, status=200)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("book_copy", "user").all()
    serializer_class = TransactionSerializer
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["book_copy__copy_id", "user__username", "user__email"]
    ordering_fields = ["issued_at", "due_at", "returned_at", "created_at"]

    def get_permissions(self):
        # keep create/modify restricted to admin, but reading allowed for authenticated
        if self.action in ["create", "return_txn", "renew", "mark_lost", "export"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not (getattr(user, "is_staff", False) or getattr(user, "role", "") == "admin"):
            qs = qs.filter(user=user)
        book_code = self.request.query_params.get("book_code")
        user_id = self.request.query_params.get("user_id")
        status_param = self.request.query_params.get("status")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if book_code:
            qs = qs.filter(book_copy__book__book_code__icontains=book_code)
        if user_id:
            qs = qs.filter(user__id=user_id)
        if status_param:
            qs = qs.filter(status__iexact=status_param)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = TransactionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        book_copy = serializer.validated_data["book_copy"]
        with db_transaction.atomic():
            locked = BookCopy.objects.select_for_update().get(pk=book_copy.pk)
            if locked.status != "available":
                return Response({"error": "Book copy not available"}, status=400)
            txn = serializer.save()
            create_audit(request.user, "TRANSACTION_CREATE", target_type="Transaction", target_id=txn.id, payload={
                "book_copy": txn.book_copy.copy_id,
                "user": txn.user.id,
                "due_at": txn.due_at.isoformat() if txn.due_at else None,
            })
            return Response(TransactionSerializer(txn).data, status=201)

    @action(detail=True, methods=["post"], url_path="return", url_name="return_txn")
    def return_txn(self, request, pk=None):
        txn = self.get_object()
        serializer = TransactionReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with db_transaction.atomic():
            if txn.status == Transaction.STATUS_COMPLETED:
                return Response({"message": "Transaction already completed."}, status=200)
            BookCopy.objects.select_for_update().get(pk=txn.book_copy.pk)
            txn.perform_return(actor=request.user, notes=data.get("return_notes"))
            create_audit(request.user, "TRANSACTION_RETURN", target_type="Transaction", target_id=txn.id, payload={
                "return_notes": data.get("return_notes"),
                "fine_amount": str(txn.fine_amount),
            })
            return Response(TransactionSerializer(txn).data, status=200)

    @action(detail=True, methods=["post"])
    def renew(self, request, pk=None):
        txn = self.get_object()
        days = int(request.data.get("days", getattr(settings, "LIBRARY_BORROW_DAYS_DEFAULT", 7)))
        with db_transaction.atomic():
            txn.perform_renew(additional_days=days, actor=request.user, notes=request.data.get("notes"))
            create_audit(request.user, "TRANSACTION_RENEW", target_type="Transaction", target_id=txn.id, payload={
                "added_days": days,
                "new_due_at": txn.due_at.isoformat() if txn.due_at else None,
            })
            return Response(TransactionSerializer(txn).data, status=200)

    @action(detail=True, methods=["post"], url_path="mark-lost")
    def mark_lost(self, request, pk=None):
        txn = self.get_object()
        fine_amount = request.data.get("fine_amount")
        with db_transaction.atomic():
            txn.mark_lost(fine_amount=fine_amount, actor=request.user, notes=request.data.get("notes"))
            create_audit(request.user, "TRANSACTION_MARK_LOST", target_type="Transaction", target_id=txn.id, payload={
                "fine_amount": str(txn.fine_amount),
            })
            return Response(TransactionSerializer(txn).data, status=200)

    @action(detail=False, methods=["get"], permission_classes=[IsAdminUser], url_path="export")
    def export(self, request):
        qs = self.filter_queryset(self.get_queryset())
        headers = ["Txn ID", "Copy ID", "Book Title", "User ID", "User Name", "Type", "Status", "Issued At", "Due At", "Returned At", "Fine"]
        rows = []
        for t in qs:
            rows.append([
                t.id,
                t.book_copy.copy_id,
                t.book_copy.book.title,
                t.user.id,
                getattr(t.user, "username", str(t.user)),
                t.type,
                t.status,
                t.issued_at.isoformat() if t.issued_at else "",
                t.due_at.isoformat() if t.due_at else "",
                t.returned_at.isoformat() if t.returned_at else "",
                str(t.fine_amount),
            ])
        fname = f"transactions_export_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{fname}"'
        writer = csv.writer(response)
        writer.writerow(headers)
        writer.writerows(rows)
        return response


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related("actor").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["action", "target_type", "target_id", "actor__username"]
    ordering_fields = ["created_at"]


# ---------- Analytics / Stats (M4) ----------
from django.db.models import Count, Q, F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_overview(request):
    """
    /api/library/stats/overview/
    Returns totals for books, copies, active users (users with active txn), issued, returned, lost.
    """
    # Total books and copies
    total_books = Book.objects.count()
    total_copies = BookCopy.objects.count()

    # Active users (users who have at least one transaction in the DB)
    # Note: counts distinct users in Transaction table
    active_users = Transaction.objects.values("user").distinct().count()

    # Issues / Returns / Lost (overall)
    total_issued = Transaction.objects.filter(type=Transaction.TYPE_ISSUE).count()
    total_returned = Transaction.objects.filter(type=Transaction.TYPE_RETURN).count()
    total_lost = Transaction.objects.filter(type=Transaction.TYPE_LOST).count()

    # Currently issued (status active and type ISSUE) — more accurate to check BookCopy.status
    currently_issued = BookCopy.objects.filter(status__iexact="issued").count()
    currently_lost = BookCopy.objects.filter(status__iexact="lost").count()

    data = {
        "total_books": total_books,
        "total_copies": total_copies,
        "active_users": active_users,
        "total_issued_transactions": total_issued,
        "total_returned_transactions": total_returned,
        "total_lost_transactions": total_lost,
        "currently_issued_copies": currently_issued,
        "currently_lost_copies": currently_lost,
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_trends(request):
    """
    /api/library/stats/trends/
    Returns monthly issue/return counts for last N months (default 12).
    Response:
    {
      "months": ["2024-11", "2024-12", ...],
      "issues": [10, 12, ...],
      "returns": [8, 9, ...]
    }
    """
    months = int(request.query_params.get("months", 12))
    now = timezone.now()
    start = (now - timedelta(days=months * 31)).replace(day=1)  # approximate N months back

    qs = Transaction.objects.filter(created_at__gte=start)

    # Annotate by TruncMonth
    agg = (
        qs.annotate(month=TruncMonth("created_at"))
          .values("month")
          .annotate(
              issues=Count("id", filter=Q(type=Transaction.TYPE_ISSUE)),
              returns=Count("id", filter=Q(type=Transaction.TYPE_RETURN)),
              losts=Count("id", filter=Q(type=Transaction.TYPE_LOST)),
          )
          .order_by("month")
    )

    # Build contiguous months list from start -> now to ensure months with zero counts are present
    months_list = []
    current = start
    while current <= now:
        months_list.append(current.strftime("%Y-%m"))
        # add one month
        year = current.year + (current.month // 12)
        month = (current.month % 12) + 1
        current = current.replace(year=year, month=month, day=1)

    mapping = {item["month"].strftime("%Y-%m"): item for item in agg}

    issues = []
    returns = []
    losts = []
    for m in months_list:
        rec = mapping.get(m)
        if rec:
            issues.append(rec.get("issues", 0))
            returns.append(rec.get("returns", 0))
            losts.append(rec.get("losts", 0))
        else:
            issues.append(0)
            returns.append(0)
            losts.append(0)

    return Response({"months": months_list, "issues": issues, "returns": returns, "losts": losts})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_category(request):
    """
    /api/library/stats/category/
    Returns count of books grouped by category, ordered by count desc.
    Supports optional `top` param (int) to limit results.
    """
    top = int(request.query_params.get("top", 0))
    qs = (
        Book.objects.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    # normalize category names (null/empty -> 'Uncategorized')
    results = []
    for item in qs:
        cat = item["category"] or "Uncategorized"
        results.append({"category": cat, "count": item["count"]})

    if top and top > 0:
        results = results[:top]

    return Response({"categories": results})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_admin_activity(request):
    """
    /api/library/stats/admin/
    Returns top admins by action count from AuditLog.
    Optional params:
      - top (int) : number of top admins (default 10)
      - since (YYYY-MM-DD) : filter audit entries since this date
    """
    top = int(request.query_params.get("top", 10))
    since = request.query_params.get("since")
    qs = AuditLog.objects.all()

    if since:
        try:
            dt = timezone.datetime.fromisoformat(since)
            # make timezone-aware if naive
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            qs = qs.filter(created_at__gte=dt)
        except Exception:
            # ignore invalid date formats
            pass

    agg = (
        qs.values("actor__id", "actor__username")
          .annotate(actions=Count("id"))
          .order_by("-actions")[:top]
    )

    results = []
    for item in agg:
        results.append({
            "actor_id": item.get("actor__id"),
            "actor_username": item.get("actor__username"),
            "actions": item.get("actions", 0),
        })
    return Response({"top_admins": results})


# -------------------------
# M5: Admin Summary Endpoint
# -------------------------
from rest_framework.decorators import api_view, permission_classes

@api_view(["GET"])
@permission_classes([IsAdminUser])
def reports_summary(request):
    """
    /api/library/reports/summary/
    Returns a compact summary used for dashboard cards.
    """
    total_books = Book.objects.filter(is_active=True).count()
    inactive_books = Book.objects.filter(is_active=False).count()
    total_copies = BookCopy.objects.count()
    issued_copies = BookCopy.objects.filter(status__iexact="issued").count()
    lost_copies = BookCopy.objects.filter(status__iexact="lost").count()
    archived_txns = TransactionArchive.objects.count()

    return Response({
        "total_books": total_books,
        "inactive_books": inactive_books,
        "total_copies": total_copies,
        "issued_copies": issued_copies,
        "lost_copies": lost_copies,
        "archived_transactions": archived_txns,
    })
