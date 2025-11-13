# library/views.py
"""
ILAS – Final View Layer (Aligned with Models, Serializers, and Signals)
----------------------------------------------------------------------
Implements:
- Book CRUD + bulk upload
- Transactions (Issue / Return / Status)
- CSV Reports
- Admin AJAX endpoints
- Audit-safe operations
"""

import io
import csv
from venv import logger
import zipfile
import openpyxl
from datetime import datetime, timezone as dt_timezone
from typing import Optional

from django.http import HttpResponse, JsonResponse
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .permissions import IsAdminOrReadOnly



from rest_framework import viewsets, status, mixins, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth import get_user_model
from .models import Book, BookTransaction, AuditLog, create_audit
from .serializers import (
    BookSerializer,
    BookTransactionSerializer,
    AuditLogSerializer,
    BulkBookImportSerializer,
    PublicBookSerializer,
)

User = get_user_model()


# ----------------------------------------------------------
# Utility Functions
# ----------------------------------------------------------
def parse_date_param(qs, key: str) -> Optional[datetime]:
    """Parse date parameters safely"""
    val = qs.get(key)
    if not val:
        return None
    try:
        return datetime.fromisoformat(val).replace(tzinfo=dt_timezone.utc)
    except Exception:
        try:
            return datetime.strptime(val, "%Y-%m-%d").replace(tzinfo=dt_timezone.utc)
        except Exception:
            return None


def csv_response(filename: str, rows, headers):
    """Return a CSV response"""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        if isinstance(row, dict):
            writer.writerow([row.get(h, "") for h in headers])
        else:
            writer.writerow(row)
    resp = HttpResponse(buf.getvalue(), content_type="text/csv")
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


# ----------------------------------------------------------
# Book CRUD + Bulk Upload
# ----------------------------------------------------------
class BookViewSet(viewsets.ModelViewSet):
    """Book CRUD and bulk upload"""

    queryset = Book.objects.all().order_by("-created_at")
    serializer_class = BookSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminOrReadOnly]

    def get_permissions(self):
        if self.action in ("bulk_upload",):
            return [IsAdminUser()]
        return super().get_permissions()

    def perform_create(self, serializer):
        data = serializer.validated_data
        data.setdefault("category", "General")
        data.setdefault("shelf_location", "Unassigned")
        serializer.save(last_modified_by=self.request.user, **data)


    def perform_update(self, serializer):
        book = self.get_object()
        if book.status == Book.STATUS_ISSUED:
            raise serializers.ValidationError("Cannot edit a book while it is issued.")
        serializer.save(last_modified_by=self.request.user)

    def perform_destroy(self, instance):
        if instance.status == Book.STATUS_ISSUED:
            raise serializers.ValidationError("Cannot delete a book while it is issued.")
        instance.delete()

    # ------------------------
    # Bulk Upload (Excel + ZIP)
    # ------------------------
    @action(detail=False, methods=["post"], permission_classes=[IsAdminUser], url_path="bulk-upload")
    def bulk_upload(self, request):
        excel_file = request.FILES.get("file")
        images_zip = request.FILES.get("images")
        if not excel_file:
            return Response({"detail": "Excel file is required."}, status=400)

        # Load cover images map
        images_map = {}
        if images_zip:
            try:
                with zipfile.ZipFile(images_zip) as z:
                    for name in z.namelist():
                        base = name.split("/")[-1].lower()
                        if base.endswith((".jpg", ".jpeg", ".png")):
                            images_map[base] = z.read(name)
            except zipfile.BadZipFile:
                return Response({"detail": "Invalid ZIP file."}, status=400)

        # Parse Excel
        try:
            wb = openpyxl.load_workbook(excel_file, data_only=True)
            ws = wb.active
            header = [str(c.value).strip().lower() if c.value else "" for c in ws[1]]
        except Exception as e:
            return Response({"detail": f"Excel error: {e}"}, status=400)

        created, failed = 0, []
        for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not row or all(v in (None, "") for v in row):
                continue
            data = dict(zip(header, row))
            serializer = BulkBookImportSerializer(data=data)
            try:
                serializer.is_valid(raise_exception=True)
                book = Book(**serializer.validated_data, last_modified_by=request.user)
                setattr(book, "_suppress_audit", True)
                book.save()
                # Attach image
                for key in [
                    f"{(book.isbn or '').strip().lower()}.jpg",
                    f"{(book.title or '').strip().lower()}.jpg",
                ]:
                    if key in images_map:
                        book.cover_image.save(f"{book.book_code}.jpg", ContentFile(images_map[key]), save=True)
                        break
                created += 1
            except Exception as e:
                logger.warning("Bulk upload row %d failed: %s", i, e)
                failed.append(f"Row {i}: {str(e)[:200]}")

        create_audit(
            request.user,
            AuditLog.ACTION_BULK_UPLOAD,
            "Book",
            "BulkImport",
            new_values={"books_created": created},
            remarks=f"Bulk uploaded {created} books",
            source="admin-ui",
        )

        return Response({"created": created, "failed": len(failed), "errors": failed[:10]}, status=200)

    # ------------------------
    # Search API
    # ------------------------
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="search")
    def search(self, request):
        q = request.query_params.get("q", "").strip()
        qs = self.queryset
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(isbn__icontains=q) | Q(book_code__icontains=q))
        serializer = self.get_serializer(qs[:25], many=True)
        return Response(serializer.data)
    
    # ------------------------
    # Public Book Listing (safe, read-only)
    # ------------------------
    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="public")
    def public(self, request):
        """Publicly accessible book list (no auth)."""
        search = request.query_params.get("q", "").strip()
        qs = Book.objects.filter(is_active=True)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search))
        data = PublicBookSerializer(qs[:100], many=True).data
        return Response(data, status=200)


# ----------------------------------------------------------
# Transactions: Issue / Return / Status (Fully Validated)
# ----------------------------------------------------------

class IssueBookAPIView(APIView):
    """Issue a book to a member with validation."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = BookTransactionSerializer(
            data={
                "book": request.data.get("book_id"),
                "member": request.data.get("member_id"),
                "txn_type": BookTransaction.TYPE_ISSUE,
                "remarks": request.data.get("remarks", ""),
            },
            context={"request": request},
        )

        try:
            serializer.is_valid(raise_exception=True)
            txn = serializer.save()
            return Response(BookTransactionSerializer(txn).data, status=201)
        except serializers.ValidationError as e:
            return Response({"errors": e.detail}, status=400)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            return Response({"detail": f"Unexpected error: {e}"}, status=500)


class ReturnBookAPIView(APIView):
    """Handles book return operations with same-member validation and fine calculation."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        book_id = request.data.get("book_id")
        member_id = request.data.get("member_id")
        remarks = request.data.get("remarks", "")

        if not book_id or not member_id:
            return Response({"detail": "book_id and member_id are required."}, status=400)

        # Fetch book and member
        book = get_object_or_404(Book, pk=book_id)
        member = get_object_or_404(get_user_model(), pk=member_id)

        try:
            # Call the model method that handles validation + atomic locking
            txn = book.mark_returned(
                actor=request.user,
                returned_by=member,
                remarks=remarks,
            )

            return Response(
                {
                    "detail": "Book returned successfully.",
                    "book_code": book.book_code,
                    "fine_amount": str(txn.fine_amount),
                },
                status=200,
            )

        except ValueError as e:
            # Expected business validation failures
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            logger.exception("ReturnBookAPIView failed: %s", e)
            return Response({"detail": f"Unexpected error: {e}"}, status=500)

class UpdateBookStatusAPIView(APIView):
    """Handles Lost / Damaged / Maintenance / Available"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        book_id = request.data.get("book_id")
        status_type = str(request.data.get("status", "")).upper()
        remarks = request.data.get("remarks", "")

        book = get_object_or_404(Book, pk=book_id)

        try:
            if status_type == "AVAILABLE":
                # Only allow AVAILABLE if not issued
                if book.status == Book.STATUS_ISSUED:
                    return Response(
                        {"detail": "Use the Return endpoint for issued books."}, status=400
                    )
                book.mark_status("MAINTENANCE" if book.status == Book.STATUS_MAINTENANCE else "AVAILABLE",
                                 actor=request.user, remarks=remarks)
            else:
                txn = book.mark_status(status_type, actor=request.user, remarks=remarks)
            return Response(
                {"book_code": book.book_code, "status": book.status},
                status=200,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)


# ----------------------------------------------------------
# Reports (CSV)
# ----------------------------------------------------------
class MasterReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        start = parse_date_param(request.query_params, "start_date")
        end = parse_date_param(request.query_params, "end_date")
        qs = Book.objects.all()
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        headers = ["book_code", "title", "author", "isbn", "status", "shelf_location", "created_at"]
        rows = (
            {"book_code": b.book_code, "title": b.title, "author": b.author,
             "isbn": b.isbn, "status": b.status, "shelf_location": b.shelf_location,
             "created_at": b.created_at.isoformat()}
            for b in qs
        )
        return csv_response("master_report.csv", rows, headers)


class TransactionReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = BookTransaction.objects.select_related("book", "member")
        headers = ["id", "book_code", "title", "txn_type", "member", "issue_date", "due_date", "return_date", "fine_amount"]
        rows = (
            {"id": t.id, "book_code": t.book.book_code, "title": t.book.title, "txn_type": t.txn_type,
             "member": t.member.username if t.member else "", "issue_date": t.issue_date,
             "due_date": t.due_date, "return_date": t.return_date, "fine_amount": str(t.fine_amount)}
            for t in qs
        )
        return csv_response("transaction_report.csv", rows, headers)


class InventoryReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        headers = ["status", "count"]
        data = [(s, Book.objects.filter(status=s).count()) for s, _ in Book.STATUS_CHOICES]
        return csv_response("inventory_report.csv", ({"status": s, "count": c} for s, c in data), headers)


# ----------------------------------------------------------
# Admin AJAX Search
# ----------------------------------------------------------
def admin_search_books(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse([], safe=False)

    books = Book.objects.filter(
        Q(title__icontains=query) | Q(isbn__icontains=query) | Q(book_code__icontains=query)
    )[:10]
    data = [
        {
            "id": b.id,
            "book_code": b.book_code,
            "title": b.title,
            "author": b.author or "",
            "isbn": b.isbn or "",
            "status": b.status,
            "shelf": b.shelf_location or "",
        }
        for b in books
    ]
    return JsonResponse(data, safe=False)


def admin_search_users(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse([], safe=False)
    users = User.objects.filter(Q(username__icontains=query) | Q(email__icontains=query))[:10]
    return JsonResponse(
        [{"id": u.id, "username": u.username, "email": u.email} for u in users],
        safe=False,
    )


def admin_active_transactions(request):
    txns = BookTransaction.objects.filter(is_active=True, txn_type="ISSUE").select_related("book", "member")[:20]
    data = [
        {
            "id": t.id,
            "book_code": t.book.book_code,
            "title": t.book.title,
            "member": t.member.username if t.member else "",
            "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
        }
        for t in txns
    ]
    return JsonResponse(data, safe=False)


# ----------------------------------------------------------
# BOOK LOOKUP API (Barcode / Search Integration)
# ----------------------------------------------------------
class BookLookupView(APIView):
    """Fetch book details by barcode (book_code) for scanning."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_code):
        book = get_object_or_404(Book, book_code__iexact=book_code)
        data = {
            "book_code": book.book_code,
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
            "status": book.status,
            "shelf_location": book.shelf_location,
            "issued_to": book.issued_to.username if book.issued_to else None,
            "due_date": None,
        }
        # If book is issued, include due_date
        if book.status == Book.STATUS_ISSUED:
            txn = (
                BookTransaction.objects.filter(
                    book=book, txn_type=BookTransaction.TYPE_ISSUE, is_active=True
                )
                .order_by("-created_at")
                .first()
            )
            if txn:
                data["due_date"] = txn.due_date.isoformat() if txn.due_date else None
        return Response(data, status=200)

# ----------------------------------------------------------
# ACTIVE TRANSACTIONS API (Real-Time Issued Books)
# ----------------------------------------------------------
class ActiveTransactionsView(APIView):
    """List all currently active issue transactions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member_id = request.query_params.get("member_id")
        qs = BookTransaction.objects.filter(txn_type=BookTransaction.TYPE_ISSUE, is_active=True).select_related("book", "member")
        if member_id:
            qs = qs.filter(member__id=member_id)
        data = []
        for t in qs:
            due_days = (timezone.now().date() - t.due_date.date()).days if t.due_date else 0
            overdue = max(0, due_days)
            data.append({
                "transaction_id": t.id,
                "book_code": t.book.book_code,
                "title": t.book.title,
                "member_name": t.member.username if t.member else None,
                "member_id": t.member.id if t.member else None,
                "issue_date": t.issue_date,
                "due_date": t.due_date,
                "days_overdue": overdue,
                "fine_estimate": str(t.fine_amount),
            })
        return Response(data, status=200)


# ----------------------------------------------------------------------
# PUBLIC BOOK LIST (Safe Read-Only)
# ----------------------------------------------------------------------
class PublicBookListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        search = request.query_params.get("q")
        qs = Book.objects.filter(is_active=True)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search))
        data = PublicBookSerializer(qs[:100], many=True).data
        return Response(data, status=200)
