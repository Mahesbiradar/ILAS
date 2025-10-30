# library/views.py
import csv
import io
import os
import zipfile

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction as db_transaction
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

from .models import Book, BookCopy, Transaction, AuditLog
from .serializers import (
    BookSerializer,
    BookCopySerializer,
    TransactionSerializer,
    TransactionReturnSerializer,
    AuditLogSerializer,
)
from .permissions import IsAdminOrReadOnly

# optional libs
try:
    import openpyxl
except Exception:
    openpyxl = None

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
except Exception:
    A4 = None


def create_audit(actor, action, target_type=None, target_id=None, payload=None):
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


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by("-added_date")
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "author", "isbn", "book_code", "category"]
    ordering_fields = ["title", "author", "quantity", "added_date"]

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

    @action(detail=False, methods=["post"], url_path="bulk_upload")
    def bulk_upload(self, request):
        excel = request.FILES.get("file")
        images_zip = request.FILES.get("images")
        if not excel:
            return Response({"error": "Excel file required under 'file'."}, status=400)

        if openpyxl is None:
            return Response({"error": "Server missing 'openpyxl' library."}, status=500)

        images_map = {}
        if images_zip:
            try:
                z = zipfile.ZipFile(images_zip)
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

        header = []
        created = []
        errors = []
        for i, row in enumerate(ws.iter_rows(values_only=True), start=1):
            if i == 1:
                header = [str(c).strip().lower() if c else "" for c in row]
                continue
            row_data = {header[j]: (row[j] if j < len(row) else None) for j in range(len(header))}
            title = row_data.get("title") or (row[0] if len(row) > 0 else "Untitled")
            author = row_data.get("author") or (row[1] if len(row) > 1 else "Unknown")
            isbn = str(row_data.get("isbn") or "").strip() or None
            category = row_data.get("category") or (row[2] if len(row) > 2 else "")
            try:
                qty = int(row_data.get("quantity") or 1)
            except Exception:
                qty = 1

            bdata = {"title": title, "author": author, "isbn": isbn, "category": category, "quantity": qty}
            try:
                serializer = BookSerializer(data=bdata)
                serializer.is_valid(raise_exception=True)
                book = serializer.save()
                attached = False
                if images_map:
                    possible_names = []
                    if isbn:
                        possible_names += [f"{isbn}.jpg", f"{isbn}.png"]
                    if book.book_code:
                        possible_names += [f"{book.book_code}.jpg", f"{book.book_code}.png"]
                    possible_names += [f"{book.title}.jpg", f"{book.title}.png"]
                    for nm in possible_names:
                        if nm.lower() in images_map:
                            content = ContentFile(images_map[nm.lower()])
                            book.cover_image.save(nm, content, save=True)
                            attached = True
                            break
                if not attached and getattr(settings, "DEFAULT_BOOK_COVER", None):
                    default_path = os.path.join(settings.MEDIA_ROOT, settings.DEFAULT_BOOK_COVER)
                    if os.path.exists(default_path):
                        with open(default_path, "rb") as f:
                            book.cover_image.save(os.path.basename(default_path), ContentFile(f.read()), save=True)
                created.append({"title": book.title, "book_code": book.book_code})
                create_audit(request.user, "BOOK_CREATE", target_type="Book", target_id=book.book_code, payload={"title": book.title})
            except Exception as e:
                errors.append({"row": i, "error": str(e), "title": title})
        return Response({"created": created, "errors": errors}, status=200)

    @action(detail=False, methods=["post"], url_path="bulk_delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "No book IDs provided."}, status=400)

        qs = Book.objects.none()
        pks = [i for i in ids if isinstance(i, int) or (isinstance(i, str) and i.isdigit())]
        codes = [i for i in ids if isinstance(i, str) and not i.isdigit()]
        if pks:
            qs = qs | Book.objects.filter(id__in=pks)
        if codes:
            qs = qs | Book.objects.filter(book_code__in=codes)
        deleted_count = qs.count()
        for book in qs:
            try:
                if book.cover_image and hasattr(book.cover_image, "path") and os.path.exists(book.cover_image.path):
                    os.remove(book.cover_image.path)
            except Exception:
                pass
            for copy in book.copies.all():
                try:
                    if copy.barcode_image and hasattr(copy.barcode_image, "path") and os.path.exists(copy.barcode_image.path):
                        os.remove(copy.barcode_image.path)
                except Exception:
                    pass
            create_audit(request.user, "BOOK_DELETE", target_type="Book", target_id=book.book_code, payload={"title": book.title})
            book.delete()
        return Response({"message": f"{deleted_count} books deleted."}, status=200)


class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.select_related("book").all().order_by("-created_at")
    serializer_class = BookCopySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination

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
        if A4 is None:
            return Response({"error": "reportlab not installed"}, status=500)

        copy_id = request.query_params.get("copy_id")
        copy_ids_param = request.query_params.get("copy_ids")
        book_ids_param = request.query_params.get("book_ids")

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
        max_cols, max_rows = 3, 8
        col, row = 0, 0

        for copy in copies:
            if not copy.barcode_image:
                continue
            img_path = os.path.join(settings.MEDIA_ROOT, str(copy.barcode_image))
            if not os.path.exists(img_path):
                continue

            x = x_margin + col * col_spacing
            y = height - y_margin - row * row_spacing

            try:
                p.drawImage(ImageReader(img_path), x, y - 20 * mm, width=55 * mm, height=30 * mm, preserveAspectRatio=True, anchor="nw")
            except Exception as e:
                print("PDF barcode error:", e)

            col += 1
            if col >= max_cols:
                col, row = 0, row + 1
                if row >= max_rows:
                    p.showPage()
                    row = 0

        p.save()
        buffer.seek(0)
        fname = "barcodes_all.pdf"
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{fname}"'
        return response

    def single(self, request, pk=None):
        if A4 is None:
            return Response({"error": "reportlab not installed"}, status=500)

        try:
            copy = BookCopy.objects.get(copy_id=pk)
        except BookCopy.DoesNotExist:
            return Response({"error": "Invalid copy ID"}, status=404)

        if not copy.barcode_image:
            return Response({"error": "Barcode not found"}, status=404)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        x = (width - (120 * mm)) / 2
        y = (height - (60 * mm)) / 2

        try:
            img_path = os.path.join(settings.MEDIA_ROOT, str(copy.barcode_image))
            if os.path.exists(img_path):
                p.drawImage(ImageReader(img_path), x, y, width=120 * mm, height=60 * mm, preserveAspectRatio=True, anchor="nw")
        except Exception as e:
            print("Single barcode PDF error:", e)

        p.save()
        buffer.seek(0)
        fname = f"{copy.copy_id}.pdf"
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
