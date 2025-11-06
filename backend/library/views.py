# library/views.py
import code
import csv
import io
import os
from turtle import title
import zipfile
from datetime import timedelta
from . import reports


from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q, Count
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404

from .models import Book, BookCopy, AuditLog, TransactionArchive
from .serializers import BookSerializer, BookCopySerializer, AuditLogSerializer, BulkBookImportSerializer
from .permissions import IsAdminOrReadOnly

# Excel import lib
try:
    import openpyxl
except Exception:
    openpyxl = None


# ----------------------------------------------------------------------
# AUDIT LOGGER
# ----------------------------------------------------------------------
def create_audit(user, action, target_type, target_id=None, payload=None, source="system"):
    """
    Create a consistent audit log entry.
    Used by admin and API events.
    """
    from .models import AuditLog

    if isinstance(payload, (dict, list)):
        data = payload
    else:
        data = {"details": str(payload) if payload else ""}

    AuditLog.objects.create(
        actor=user if user and not getattr(user, "is_anonymous", True) else None,
        action=action.upper(),
        target_type=target_type,
        target_id=target_id,
        source=source,
        payload=data,
    )


# ----------------------------------------------------------------------
# PAGINATION
# ----------------------------------------------------------------------
class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 200


# ======================================================================
# BOOK VIEWSET
# ======================================================================
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by("-added_date")
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "author", "isbn", "book_code", "category"]
    ordering_fields = ["title", "author", "quantity", "added_date"]
    lookup_field = "book_code"
    lookup_value_regex = r"[^/]+"

    def safe_remove(self, file_field):
        try:
            if file_field and hasattr(file_field, "path") and os.path.exists(file_field.path):
                os.remove(file_field.path)
        except Exception:
            pass

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)
        qs = self.filter_queryset(self.get_queryset())
        if str(lookup_value).isdigit():
            obj = qs.filter(id=int(lookup_value)).first()
        else:
            obj = qs.filter(book_code=lookup_value).first()
        if not obj:
            raise NotFound(f"Book '{lookup_value}' not found.")
        self.check_object_permissions(self.request, obj)
        return obj

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

    def create(self, request, *args, **kwargs):
        """Create a new Book record and its copies."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            book = serializer.save()
            if book.quantity > 0 and not book.copies.exists():
                book.create_copies(book.quantity)
        create_audit(request.user, "BOOK_CREATE", "Book", book.book_code, {"title": book.title})
        return Response(BookSerializer(book, context={"request": request}).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        create_audit(request.user, "BOOK_EDIT", "Book", updated.book_code, {"title": updated.title})
        return Response(BookSerializer(updated).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.safe_remove(instance.cover_image)
        title, code = instance.title, instance.book_code
        instance.delete_with_assets()
        create_audit(request.user, "BOOK_DELETE", "Book", code, {"title": title}, source="admin-ui")
        return Response({"message": f"Book '{title}' deleted successfully."}, status=200)

    # ------------------------ BULK UPLOAD ------------------------
@action(detail=False, methods=["post"], url_path="bulk_upload", permission_classes=[IsAdminUser])
def bulk_upload(self, request):
    excel = request.FILES.get("file")
    images_zip = request.FILES.get("images")

    if not excel:
        return Response({"error": "Excel file required under 'file'."}, status=400)
    if openpyxl is None:
        return Response({"error": "Missing 'openpyxl' dependency."}, status=500)

    images_map = {}
    if images_zip:
        try:
            with zipfile.ZipFile(images_zip) as z:
                for name in z.namelist():
                    base = os.path.basename(name)
                    if not base:
                        continue
                    images_map[base.lower()] = z.read(name)
        except zipfile.BadZipFile:
            return Response({"error": "Invalid ZIP file."}, status=400)

    # Load workbook
    try:
        wb = openpyxl.load_workbook(filename=excel, data_only=True)
        ws = wb.active
    except Exception as e:
        return Response({"error": f"Failed to read Excel: {e}"}, status=400)

    # header normalization (same map)
    header = [str(c).strip().lower() if c else "" for c in ws[1]]
    synonym_map = {
        "book title": "title", "bookname": "title",
        "subtitle": "subtitle", "author": "author",
        "publisher": "publisher", "edition": "edition",
        "publication year": "publication_year", "isbn": "isbn",
        "language": "language", "category": "category",
        "keywords": "keywords", "description": "description",
        "quantity": "quantity", "shelf location": "shelf_location",
        "condition": "condition", "availability status": "availability_status",
        "book cost": "book_cost", "vendor": "vendor_name",
        "source": "source", "accession_start_no": "accession_number",
        "barcode_prefix": "barcode_prefix", "storage_type": "storage_type",
        "file_url": "file_url", "digital_identifier": "digital_identifier",
        "format": "format", "qr_code": "qr_code",
        "library_section": "library_section", "dewey_decimal": "dewey_decimal",
        "cataloger": "cataloger", "remarks": "remarks",
    }
    canonical_header = [synonym_map.get(h, h) for h in header]

    created = []
    errors = []
    allowed_fields = {f.name for f in Book._meta.get_fields()}

    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not row or all(v in (None, "") for v in row):
            continue
        row_data = {}
        for j, val in enumerate(row):
            if j >= len(canonical_header):
                continue
            key = canonical_header[j]
            if key:
                row_data[key] = val

        # normalize numeric-ish fields
        try:
            if "quantity" in row_data and row_data["quantity"] not in (None, ""):
                row_data["quantity"] = int(float(row_data["quantity"]))
        except Exception:
            pass
        try:
            if "publication_year" in row_data and row_data["publication_year"] not in (None, ""):
                row_data["publication_year"] = int(float(row_data["publication_year"]))
        except Exception:
            pass
        if "book_cost" in row_data and row_data["book_cost"] not in (None, ""):
            row_data["book_cost"] = str(row_data["book_cost"]).strip()

        if not row_data.get("title"):
            errors.append({"row": i, "error": "Missing title"})
            continue

        # Validate via BulkBookImportSerializer
        serializer = BulkBookImportSerializer(data=row_data)
        try:
            serializer.is_valid(raise_exception=True)
            book_data = serializer.validated_data

            # pull qty and remove it before creating the Book
            qty = int(book_data.get("quantity") or 1)
            if "quantity" in book_data:
                book_data.pop("quantity")

            # remove None values so DB defaults apply
            filtered_data = {k: v for k, v in book_data.items() if (k in allowed_fields and v is not None)}

            with transaction.atomic():
                book = Book.objects.create(**filtered_data)

                # attach cover image
                if images_map:
                    key_candidates = [f"{book.isbn or ''}.jpg", f"{book.title.lower()}.jpg"]
                    for key in key_candidates:
                        if key.lower() in images_map:
                            book.cover_image.save(f"{book.book_code}.jpg", ContentFile(images_map[key.lower()]), save=True)
                            break
                
                # --- avoid duplicate audit log entries from signals ---
                # book._skip_audit = True  # set BEFORE internal save calls

                # create copies exactly once
                if qty and qty > 0:
                    book.create_copies(qty)
                # ensure book.quantity updated (create_copies sets it)
                # book.save(update_fields=["quantity"])

                created.append({"row": i, "book": book.title, "copies": qty})
                create_audit(request.user,"BOOK_CREATE","Book",book.book_code,{"title": book.title},source="admin-ui")

        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    return Response({"created": created, "errors": errors}, status=200)

# ------------------------ BULK DELETE ------------------------
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
            b._actor = request.user
            self.safe_remove(b.cover_image)
            b.delete_with_assets()
            create_audit(request.user, "BOOK_DELETE", "Book", b.book_code, {"title": b.title})

        return Response({"message": f"{count} books deleted."}, status=200)


# ======================================================================
# BOOK COPY VIEWSET
# ======================================================================
class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.select_related("book").all()
    serializer_class = BookCopySerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["copy_code", "book__book_code", "book__title"]
    lookup_field = "copy_code"

    def list(self, request, book_code=None, *args, **kwargs):
        """List copies for a book (nested or standalone)."""
        if book_code:
            book = get_object_or_404(Book, book_code=book_code)
            copies = BookCopy.objects.filter(book=book)
        else:
            copies = self.get_queryset()

        serializer = self.get_serializer(copies, many=True)
        return Response(serializer.data, status=200)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        code = instance.copy_code
        instance._actor = request.user
        instance.delete_with_assets()
        create_audit(request.user, "BOOKCOPY_DELETE", "BookCopy", code, {"book": instance.book.book_code}, source="admin-ui")
        return Response({"message": f"Copy {code} deleted."}, status=200)

    @action(detail=False, methods=["post"], url_path="bulk_delete")
    def bulk_delete_copies(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "No copy IDs provided."}, status=400)

        qs = BookCopy.objects.filter(id__in=ids)
        count = qs.count()
        for copy in qs:
            copy.delete_with_assets()
            create_audit(request.user, "BOOK_DELETE", "Book", code, {"title": title}, source="admin-ui")
        return Response({"message": f"{count} copies deleted."}, status=200)

    @action(detail=False, methods=["post"], url_path="add_copy")
    def add_copy(self, request):
        """Add a new copy to a book (creates next sequential copy)."""
        book_code = request.data.get("book_code")
        if not book_code:
            return Response({"error": "book_code required"}, status=400)
        try:
            book = Book.objects.get(book_code=book_code)
        except Book.DoesNotExist:
            return Response({"error": "Book not found"}, status=404)

        copies = book.create_copies(1)
        copy = copies[0]
        create_audit(request.user, "BOOKCOPY_CREATE", "BookCopy", copy.copy_code, {"book": book.book_code}, source="admin-ui")
        return Response(BookCopySerializer(copy).data, status=201)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        create_audit(request.user, "BOOKCOPY_EDIT", "BookCopy", updated.copy_code, {"book": updated.book.book_code}, source="admin-ui")
        return Response(BookCopySerializer(updated).data, status=status.HTTP_200_OK)

# ======================================================================
# REPORT VIEWSET (CSV Export)
# ======================================================================
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
        """Export all books in CSV format."""
        books = Book.objects.all().order_by("title")
        headers = [
            "Book Code", "Title", "Author", "ISBN", "Category", "Quantity",
            "Cost", "Vendor", "Shelf", "Added Date"
        ]
        rows = [
            [
                b.book_code, b.title, b.author or "", b.isbn or "",
                b.category or "", b.quantity,
                str(b.book_cost or ""), b.vendor_name or "",
                b.shelf_location or "",
                timezone.localtime(b.added_date).strftime("%Y-%m-%d %H:%M")
            ]
            for b in books
        ]
        return self._csv_response("books_report.csv", headers, rows)


# ======================================================================
# AUDIT LOG VIEWSET
# ======================================================================
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to Audit Logs for administrators."""
    queryset = AuditLog.objects.all().select_related("actor").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["action", "target_type", "target_id", "actor__username"]
    ordering_fields = ["created_at"]


# ======================================================================
# ANALYTICS & DASHBOARD SUMMARY
# ======================================================================
@api_view(["GET"])
@permission_classes([IsAdminUser])
def reports_summary(request):
    """Dashboard summary for cards."""
    total_books = Book.objects.filter(is_active=True).count()
    inactive_books = Book.objects.filter(is_active=False).count()
    total_copies = BookCopy.objects.count()
    archived_txns = TransactionArchive.objects.count()
    return Response({
        "total_books": total_books,
        "inactive_books": inactive_books,
        "total_copies": total_copies,
        "archived_transactions": archived_txns,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_overview(request):
    """Basic overview of counts for dashboard."""
    total_books = Book.objects.count()
    inactive_books = Book.objects.filter(is_active=False).count()
    total_copies = BookCopy.objects.count()
    archived_txns = TransactionArchive.objects.count()

    data = {
        "total_books": total_books,
        "inactive_books": inactive_books,
        "total_copies": total_copies,
        "archived_transactions": archived_txns,
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats_category(request):
    """Category-wise book count for charts."""
    top = int(request.query_params.get("top", 0))
    qs = (
        Book.objects.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    results = [{"category": i["category"] or "Uncategorized", "count": i["count"]} for i in qs]
    if top and top > 0:
        results = results[:top]
    return Response({"categories": results})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def export_books_csv(request):
    return reports.books_report_csv(request)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def export_inventory_summary(request):
    return reports.inventory_summary_csv(request)
