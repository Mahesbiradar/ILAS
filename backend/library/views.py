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
from unicodedata import category
import logging
logger = logging.getLogger(__name__)
import zipfile
import openpyxl
from datetime import datetime, timezone as dt_timezone
from typing import Optional

from django.http import HttpResponse
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
from .pagination import StandardResultsSetPagination, AdminResultsSetPagination
from .models import BookTransaction  # add at top if not imported


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
    pagination_class = StandardResultsSetPagination

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

    def list(self, request, *args, **kwargs):
        qs = self.queryset

        # --- Search Support ---
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(author__icontains=search)
                | Q(isbn__icontains=search)
                | Q(book_code__icontains=search)
                | Q(accession_no__icontains=search)
                | Q(shelf_location__icontains=search)
            )

        # --- Category Filter ---
        category = request.query_params.get("category", "").strip()
        if category:
            qs = qs.filter(category__icontains=category)

        # --- Status Filter ---
        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status__icontains=status)    
        # --- Shelf Location Filter ---
        shelf = request.query_params.get("shelf")
        if shelf:
            qs = qs.filter(shelf_location__icontains=shelf)


        # Pagination + serializer
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
    


    # ------------------------
    # Bulk Upload (Excel + ZIP)
    # ------------------------
    @action(detail=False, methods=["post"], permission_classes=[IsAdminUser], url_path="bulk-upload")
    def bulk_upload(self, request):
        import uuid # Local import to ensure availability
        logger.warning("🔥 BULK UPLOAD HIT: request received")
        try:
            excel_file = request.FILES.get("file")
            images_zip = request.FILES.get("images")
            
            if not excel_file:
                logger.warning("❌ Missing Excel file")
                return Response({"detail": "Excel file is required."}, status=400)

            # 1. Parse Excel & Count Rows (Read-Only)
            try:
                # data_only=True to get values not formulas
                wb = openpyxl.load_workbook(excel_file, data_only=True, read_only=True)
                ws = wb.active
                
                # Get headers
                rows_iter = ws.iter_rows(values_only=True)
                try:
                    header_row = next(rows_iter)
                except StopIteration:
                    return Response({"detail": "Empty Excel file."}, status=400)
                
                header = [str(c).strip().lower() if c else "" for c in header_row]
                
                # We need to list all rows to count them and process them
                # Converting generator to list to allow counting + multiple iterations/lookups
                all_rows = list(rows_iter)
                row_count = len(all_rows)
                logger.warning(f"📊 Excel loaded. Rows: {row_count}")

            except Exception as e:
                logger.error(f"❌ Excel error: {e}")
                return Response({"detail": f"Excel parsing error: {str(e)}"}, status=400)

            # 2. Limit Check
            if images_zip and row_count > 20:
                msg = f"Bulk upload with ZIP images is limited to 20 books (you have {row_count}). Use Excel-only upload for larger datasets."
                logger.warning(f"❌ Limit exceeded: {msg}")
                return Response({"error": msg}, status=400)

            # 3. ZIP Extraction (if provided) OR Cloudinary Lookup (if Excel-only)
            images_map = {}
            valid_cloudinary_ids = {}

            if images_zip:
                # Mode B: Excel + ZIP
                try:
                    logger.warning("🗜️ Processing ZIP file...")
                    with zipfile.ZipFile(images_zip) as z:
                        for name in z.namelist():
                            if name.endswith("/") or "__MACOSX" in name:
                                continue
                            base = name.split("/")[-1].lower().strip()
                            if base and base.endswith((".jpg", ".jpeg", ".png")):
                                images_map[base] = z.read(name)
                    logger.warning(f"🖼️ Loaded {len(images_map)} images from ZIP")
                except Exception as e:
                    return Response({"detail": f"Invalid ZIP file: {str(e)}"}, status=400)
            
            else:
                # Mode A: Excel-Only (Scalable)
                # Optimization: Prefetch Cloudinary IDs for these ISBNs
                logger.warning("☁️ Excel-only mode: Checking Cloudinary for existing covers...")
                isbns = []
                for row in all_rows:
                    if not row: continue
                    # Safe mapping
                    row_data = dict(zip(header, row))
                    # Assuming 'isbn' is key, handle case sensitivity
                    isbn_val = row_data.get('isbn')
                    if isbn_val:
                        # cleanup isbn
                        clean_isbn = str(isbn_val).strip().replace("-", "").upper()
                        if clean_isbn:
                            isbns.append(clean_isbn)
                
                # Batch check Cloudinary (chunked to be safe)
                if isbns:
                    try:
                        import cloudinary.api
                        # Dedup
                        isbns = list(set(isbns))
                        # Check in chunks of 50 to avoid URL length/API limits
                        chunk_size = 50
                        for i in range(0, len(isbns), chunk_size):
                            chunk = isbns[i:i + chunk_size]
                            try:
                                # Start with ISBNs as public_ids (we assume public_id=ISBN for covers)
                                # resources_by_ids returns details for found resources
                                result = cloudinary.api.resources_by_ids(chunk)
                                for res in result.get("resources", []):
                                    pid = res["public_id"]
                                    valid_cloudinary_ids[pid] = pid
                                    # Also handle case where ISBN might be part of ID or loosely matched? 
                                    # For now, strict match on public_id == ISBN
                            except Exception as chunk_err:
                                logger.warning(f"⚠️ Cloudinary chunk check failed: {chunk_err}")
                                # Continue without failing
                        logger.warning(f"✅ Found {len(valid_cloudinary_ids)} existing covers in Cloudinary")
                    except Exception as cloud_err:
                        logger.warning(f"⚠️ Cloudinary lookup skipped: {cloud_err}")


            # 4. Processing Loop
            created, failed, errors = 0, 0, []
            
            # --- PATH A: Bulk Create (Excel Only) ---
            if not images_zip:
                book_buffer = []
                BATCH_SIZE = 25
                
                logger.warning(f"🚀 Starting optimized bulk insert (Batch Size: {BATCH_SIZE})")

                def flush_buffer(buf):
                    if not buf: return 0
                    try:
                        # 1. Bulk Create (DB Insert)
                        # We use a temp UUID-based book_code to satisfy unique constraint during insert
                        objs = Book.objects.bulk_create(buf)
                        
                        # 2. Fix Layout (book_code) via Bulk Update
                        # We need PKs to generate standard book_code
                        updates = []
                        for b in objs:
                            if b.pk:
                                b.book_code = f"ILAS-ET-{b.pk:04d}"
                                updates.append(b)
                        
                        if updates:
                            Book.objects.bulk_update(updates, ['book_code'])
                            
                        return len(buf)
                    except Exception as e:
                        # If batch fails, we lose this chunk. 
                        # In atomic block, this would rollback. Here we just log.
                        logger.error(f"❌ Batch insert failed: {e}")
                        # Ideally we'd re-try one by one, but for speed we fail the chunk
                        # Or we could just catch and append to failed count
                        return 0

                for i, row in enumerate(all_rows, start=2):
                    if not row or all(v in (None, "") for v in row):
                        continue
                    
                    try:
                        data = dict(zip(header, row))
                        serializer = BulkBookImportSerializer(data=data)
                        
                        if serializer.is_valid():
                            # Instantiate but DO NOT SAVE
                            book = Book(**serializer.validated_data)
                            book.last_modified_by = request.user
                            book._suppress_audit = True
                            
                            # Temp unique code to satisfy constraint during insert
                            book.book_code = uuid.uuid4().hex[:30]

                            # Link Image
                            raw_isbn = book.isbn or ""
                            clean_isbn = raw_isbn.strip().replace("-", "").upper()
                            if clean_isbn in valid_cloudinary_ids:
                                book.cover_image = valid_cloudinary_ids[clean_isbn]
                            
                            book_buffer.append(book)
                            
                            # Flush if full
                            if len(book_buffer) >= BATCH_SIZE:
                                count = flush_buffer(book_buffer)
                                created += count
                                if count == 0:
                                    failed += len(book_buffer)
                                    errors.append({"row": i, "message": "Batch insert failed (check logs)"})
                                book_buffer = [] # Reset
                        else:
                            failed += 1
                            err_msg = "; ".join([f"{k}: {v[0]}" for k, v in serializer.errors.items()])
                            errors.append({"row": i, "message": err_msg})
                    except Exception as row_err:
                        failed += 1
                        errors.append({"row": i, "message": str(row_err)[:200]})
                
                # Flush remaining
                if book_buffer:
                    count = flush_buffer(book_buffer)
                    created += count
                    if count == 0:
                        failed += len(book_buffer)
                
            # --- PATH B: Legacy Loop (ZIP + Atomic + Save) ---
            else:
                logger.warning("🐌 Legacy slow upload (ZIP mode)")
                for i, row in enumerate(all_rows, start=2):
                    if not row: continue

                    try:
                        with transaction.atomic():
                            data = dict(zip(header, row))
                            serializer = BulkBookImportSerializer(data=data)
                            
                            if serializer.is_valid():
                                book = Book(**serializer.validated_data)
                                book.last_modified_by = request.user
                                book._suppress_audit = True
                                
                                # Image Logic (ZIP)
                                raw_isbn = book.isbn or ""
                                clean_isbn = raw_isbn.strip().replace("-", "").upper()
                                match = None
                                keys_to_try = [
                                    f"{raw_isbn.strip().lower()}.jpg",
                                    f"{(book.title or '').strip().lower()}.jpg",
                                    f"{clean_isbn.lower()}.jpg"
                                ]
                                for k in keys_to_try:
                                    if k in images_map:
                                        match = images_map[k]
                                        break
                                
                                # Save book (triggers signal for book_code)
                                book.save()
                                
                                if match:
                                    try:
                                        fname = f"{book.book_code}.jpg"
                                        book.cover_image.save(fname, ContentFile(match), save=True)
                                    except Exception as img_err:
                                        logger.warning(f"Row {i}: Image save failed: {img_err}")
                                        errors.append({"row": i, "message": "Book created, image upload failed"})
                                
                                created += 1
                            else:
                                failed += 1
                                msg = "; ".join([f"{k}: {v[0]}" for k, v in serializer.errors.items()])
                                errors.append({"row": i, "message": msg})

                    except Exception as row_err:
                        failed += 1
                        errors.append({"row": i, "message": str(row_err)[:200]})
                        logger.error(f"Row {i} fatal: {row_err}")

            # 5. Final Response
            wb.close()
            create_audit(
                request.user,
                AuditLog.ACTION_BULK_UPLOAD,
                "Book",
                "BulkImport",
                new_values={"created": created, "failed": failed},
                remarks=f"Bulk upload: {created} success, {failed} failed",
                source="admin-ui",
            )
            
            return Response({
                "created": created,
                "failed": failed,
                "errors": errors[:50]
            }, status=200)

        except Exception as e:
            logger.exception("🔥 BULK UPLOAD CRITICAL CRASH")
            return Response(
                {"error": "Bulk upload failed", "detail": str(e)},
                status=200 
            )

    # ------------------------
    # Search API
    # ------------------------
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="search")
    def search(self, request):
        q = request.query_params.get("q", "").strip()
        qs = self.queryset
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(isbn__icontains=q) | Q(book_code__icontains=q))
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
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
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = PublicBookSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        data = PublicBookSerializer(qs, many=True).data
        return Response(data, status=200)


# ----------------------------------------------------------
# Transactions: Issue / Return / Status (Fully Validated)
# ----------------------------------------------------------

class IssueBookAPIView(APIView):
    """Issue a book to a member with validation."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        # Accept frontend payload book_id + member_id
        serializer = BookTransactionSerializer(
            data={
                "book_id": request.data.get("book_id"),
                "member_id": request.data.get("member_id"),
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

        active_txn = (
            BookTransaction.objects.filter(book=book, txn_type=BookTransaction.TYPE_ISSUE, is_active=True)
            .select_related("member")
            .first()
        )
        if not active_txn:
            return Response({"detail": "No active issue exists for this book."}, status=400)
        if str(active_txn.member_id) != str(member.id):
            return Response(
                {"detail": "Book must be returned by the member who has the active issue."},
                status=403,
            )

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
                if book.status == Book.STATUS_REMOVED:
                    return Response(
                        {"detail": "Removed books cannot be reactivated."},
                        status=400,
                    )
                book.status = Book.STATUS_AVAILABLE
                book.last_modified_by = request.user
                # Ensure issued_to cleared when marking available
                update_fields = ["status", "last_modified_by", "updated_at"]
                if book.issued_to is not None:
                    book.issued_to = None
                    update_fields.append("issued_to")
                book.save(update_fields=update_fields)
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
    """
    CSV export for ALL transactions (Issue / Return / Lost / Damaged / Maintenance / Removed)
    Fully aligned with the final All-Transactions table design.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .models import BookTransaction
        from .views import parse_date_param

        # Base queryset
        qs = (
            BookTransaction.objects
            .select_related("book", "member", "actor")
            .order_by("-created_at")
        )

        # -------------------------
        # Apply Filters
        # -------------------------
        start = parse_date_param(request.query_params, "start_date")
        end = parse_date_param(request.query_params, "end_date")
        member_id = request.query_params.get("member_id")
        book_code = request.query_params.get("book_code")
        txn_type = request.query_params.get("txn_type")
        search = request.query_params.get("search", "").strip()

        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)
        if member_id:
            qs = qs.filter(member__id=member_id)
        if book_code:
            qs = qs.filter(book__book_code__iexact=book_code)
        if txn_type:
            qs = qs.filter(txn_type__iexact=txn_type)
        if search:
            qs = qs.filter(
                Q(book__title__icontains=search)
                | Q(book__isbn__icontains=search)
                | Q(book__book_code__icontains=search)
                | Q(member__username__icontains=search)
                | Q(member__unique_id__icontains=search)
            )

        # -------------------------
        # CSV Headers (Final Design)
        # -------------------------
        headers = [
            "id",
            "txn_type",
            "book_code",
            "title",
            "member_name",
            "member_unique_id",
            "action_date",
            "performed_by",
            "fine_amount",
            "remarks",
        ]

        # -------------------------
        # Row Iterator
        # -------------------------
        def row_iter():
            for t in qs:
                # Compute action_date according to rules:
                if t.txn_type == BookTransaction.TYPE_ISSUE:
                    action_date = t.issue_date.isoformat() if t.issue_date else ""
                elif t.txn_type == BookTransaction.TYPE_RETURN:
                    action_date = t.return_date.isoformat() if t.return_date else ""
                else:
                    # LOST / DAMAGED / MAINTENANCE / REMOVED → created_at
                    action_date = t.created_at.isoformat() if t.created_at else ""

                yield {
                    "id": t.id,
                    "txn_type": t.txn_type,
                    "book_code": t.book.book_code if t.book else "",
                    "title": t.book.title if t.book else "",
                    "member_name": t.member.username if t.member else "",
                    "member_unique_id": getattr(t.member, "unique_id", "") if t.member else "",
                    "action_date": action_date,
                    "performed_by": t.actor.username if t.actor else "",
                    "fine_amount": str(t.fine_amount or "0.00"),
                    "remarks": t.remarks or "",
                }

        return csv_response("transaction_report.csv", row_iter(), headers)



class InventoryReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        headers = ["status", "count"]
        data = [(s, Book.objects.filter(status=s).count()) for s, _ in Book.STATUS_CHOICES]
        return csv_response("inventory_report.csv", ({"status": s, "count": c} for s, c in data), headers)


class AdminBookSearchView(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        paginator = self.pagination_class()
        if not query:
            paginator.paginate_queryset(Book.objects.none(), request, view=self)
            return paginator.get_paginated_response([])

        qs = Book.objects.filter(
            Q(title__icontains=query) | Q(isbn__icontains=query) | Q(book_code__icontains=query)
        ).order_by("title")
        page = paginator.paginate_queryset(qs, request, view=self)
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
            for b in page
        ]
        return paginator.get_paginated_response(data)


class AdminUserSearchView(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        paginator = self.pagination_class()
        if not query:
            paginator.paginate_queryset(User.objects.none(), request, view=self)
            return paginator.get_paginated_response([])

        qs = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(unique_id__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(role__icontains=query)
        ).order_by("username")


        page = paginator.paginate_queryset(qs, request, view=self)
        from .models import BookTransaction  # add at top if not imported

        data = []
        for u in page:
            active_count = BookTransaction.objects.filter(
                member=u,
                txn_type=BookTransaction.TYPE_ISSUE,
                is_active=True
            ).count()

            data.append({
                "id": u.id,
                "username": u.username,
                "full_name": f"{u.first_name} {u.last_name}".strip(),
                "unique_id": u.unique_id,
                "role": u.role,
                "email": u.email,
                "phone": u.phone,
                "borrow_count": active_count,
            })

        return paginator.get_paginated_response(data)


class AdminActiveTransactionsView(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        qs = (
            BookTransaction.objects.filter(is_active=True, txn_type=BookTransaction.TYPE_ISSUE)
            .select_related("book", "member")
            .order_by("-due_date")
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = [
            {
                "id": t.id,
                "book_code": t.book.book_code,
                "title": t.book.title,
                "member": t.member.username if t.member else "",
                "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
            }
            for t in page
        ]
        return paginator.get_paginated_response(data)

#----------------------------------------------------------
# All Transactions View (with filters)
#----------------------------------------------------------
from rest_framework.permissions import IsAdminUser
from .serializers import BookTransactionSerializer  # already present above

class AllTransactionsView(APIView):
    """Paginated listing of all BookTransaction records for admin (history)."""
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        # base qs with related joins for performance
        qs = BookTransaction.objects.select_related("book", "member", "actor").order_by("-created_at")

        # Filters
        member_id = request.query_params.get("member_id")
        book_code = request.query_params.get("book_code")
        txn_type = request.query_params.get("txn_type")
        search = request.query_params.get("search", "").strip()

        # date range support using parse_date_param available in this file
        start = parse_date_param(request.query_params, "start_date")
        end = parse_date_param(request.query_params, "end_date")

        if member_id:
            qs = qs.filter(member__id=member_id)
        if book_code:
            qs = qs.filter(book__book_code__iexact=book_code)
        if txn_type:
            qs = qs.filter(txn_type__iexact=txn_type)
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)
        if search:
            qs = qs.filter(
                Q(book__title__icontains=search)
                | Q(book__isbn__icontains=search)
                | Q(book__book_code__icontains=search)
                | Q(member__username__icontains=search)
                | Q(member__unique_id__icontains=search)
                | Q(txn_type__icontains=search)   # 🔥 NEW
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = BookTransactionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# --- Patch TransactionReportView to apply filters ---
class TransactionReportView(APIView):
    """
    CSV export for ALL transactions (Issue / Return / Lost / Damaged / Maintenance / Removed)
    Fully aligned with the final All-Transactions table format.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = (
            BookTransaction.objects
            .select_related("book", "member", "actor")
            .order_by("-created_at")
        )

        # -------------------------
        # Apply Filters
        # -------------------------
        start = parse_date_param(request.query_params, "start_date")
        end = parse_date_param(request.query_params, "end_date")
        member_id = request.query_params.get("member_id")
        book_code = request.query_params.get("book_code")
        txn_type = request.query_params.get("txn_type")
        search = request.query_params.get("search", "").strip()

        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)
        if member_id:
            qs = qs.filter(member__id=member_id)
        if book_code:
            qs = qs.filter(book__book_code__iexact=book_code)
        if txn_type:
            qs = qs.filter(txn_type__iexact=txn_type)
        if search:
            qs = qs.filter(
                Q(book__title__icontains=search)
                | Q(book__isbn__icontains=search)
                | Q(book__book_code__icontains=search)
                | Q(member__username__icontains=search)
                | Q(member__unique_id__icontains=search)
                | Q(txn_type__icontains=search)     # 🔥 Added transaction-type search
            )

        # -------------------------
        # Final CSV Headers
        # -------------------------
        headers = [
            "id",
            "txn_type",
            "book_code",
            "title",
            "member_name",
            "member_unique_id",
            "action_date",
            "performed_by",
            "fine_amount",
            "remarks",
        ]

        # -------------------------
        # Row Builder
        # -------------------------
        def normalize_date(d):
            """Return only YYYY-MM-DD."""
            try:
                return d.date().isoformat()
            except:
                return ""

        def row_iter():
            for t in qs:

                # Determine canonical action date
                if t.txn_type == BookTransaction.TYPE_ISSUE:
                    action_date = normalize_date(t.issue_date)
                elif t.txn_type == BookTransaction.TYPE_RETURN:
                    action_date = normalize_date(t.return_date)
                else:
                    # DAMAGED / LOST / MAINTENANCE / REMOVED
                    action_date = normalize_date(t.created_at)

                yield {
                    "id": t.id,
                    "txn_type": t.txn_type,
                    "book_code": t.book.book_code if t.book else "",
                    "title": t.book.title if t.book else "",
                    "member_name": t.member.username if t.member else "",
                    "member_unique_id": getattr(t.member, "unique_id", "") if t.member else "",
                    "action_date": action_date,
                    "performed_by": t.actor.username if t.actor else "",
                    "fine_amount": str(t.fine_amount or "0.00"),
                    "remarks": t.remarks or "",
                }

        return csv_response("transaction_report.csv", row_iter(), headers)

# ----------------------------------------------------------
# BOOK LOOKUP API (Barcode / Search Integration)
# ----------------------------------------------------------
class BookLookupView(APIView):
    """Fetch book details by barcode (book_code) for scanning."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_code):
        book = get_object_or_404(Book, book_code__iexact=book_code)
        data = {
            "id": book.id,
            "book_code": book.book_code,
            "title": book.title,
            "subtitle": book.subtitle,
            "author": book.author,
            "publisher": book.publisher,
            "edition": book.edition,
            "publication_year": book.publication_year,
            "isbn": book.isbn,
            "language": book.language,
            "category": book.category,
            "keywords": book.keywords,
            "description": book.description,

            # 📌 Additional fields you want
            "accession_no": book.accession_no,
            "source": book.source,
            "condition": book.condition,
            "book_cost": book.book_cost,
            "vendor_name": book.vendor_name,
            "shelf_location": book.shelf_location,
            "library_section": book.library_section,
            "dewey_decimal": book.dewey_decimal,
            "cataloger": book.cataloger,
            "remarks": book.remarks,

            # 📌 Cover image
            "cover_image": request.build_absolute_uri(book.cover_image.url) if book.cover_image else None,

            # Borrow info
            "status": book.status,
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
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        member_id = request.query_params.get("member_id")
        qs = BookTransaction.objects.filter(txn_type=BookTransaction.TYPE_ISSUE, is_active=True).select_related("book", "member")
        if member_id:
            qs = qs.filter(member__id=member_id)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = []
        for t in page:
            due_days = (timezone.now().date() - t.due_date.date()).days if t.due_date else 0
            overdue = max(0, due_days)
            data.append({
                "transaction_id": t.id,
                "book_code": t.book.book_code,
                "book_title": t.book.title,
                "member_name": t.member.username if t.member else None,
                "member_id": t.member.id if t.member else None,
                "member_unique_id": getattr(t.member, "unique_id", None),
                "issue_date": t.issue_date,
                "due_date": t.due_date,
                "days_overdue": overdue,
                "fine_estimate": str(t.fine_amount),
                "actor_name": t.actor.username if t.actor else None,
            })
        return paginator.get_paginated_response(data)


# ----------------------------------------------------------------------
# PUBLIC BOOK LIST (Safe Read-Only)
# ----------------------------------------------------------------------
class PublicBookListView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        qs = Book.objects.filter(is_active=True)

        # 🔍 Search
        search = request.query_params.get("q", "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search)
            )

        # 📚 CATEGORY FILTER (✅ FIXED POSITION)
        category = request.query_params.get("category", "").strip()
        if category:
            qs = qs.filter(category__iexact=category)

        qs = qs.order_by("title")

        # 📄 Pagination AFTER all filters
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)

        serializer = PublicBookSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class LibraryMetaAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        categories = Book.objects.values_list("category", flat=True).distinct()
        return Response({"categories": sorted(list(set(categories)))})

from django.core.cache import cache
from rest_framework.response import Response

DASHBOARD_CACHE_KEY = "admin_dashboard_stats"

