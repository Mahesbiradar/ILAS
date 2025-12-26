# library/views_reports.py

from datetime import timedelta
from decimal import Decimal
import json

import openpyxl
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.timezone import localtime
from django.db import models

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import Book, BookTransaction, AuditLog
from .pagination import StandardResultsSetPagination, AdminResultsSetPagination


# =========================================================
# EXISTING REPORTS (UNCHANGED)
# =========================================================

class ActiveIssuesReport(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        qs = (
            BookTransaction.objects.filter(
                txn_type=BookTransaction.TYPE_ISSUE,
                is_active=True,
                book__is_active=True,
            )
            .select_related("book", "member")
            .order_by("-issue_date")
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)

        today = timezone.now().date()
        data = []
        for t in page:
            due = t.due_date.date() if t.due_date else None
            days_overdue = max(0, (today - due).days) if due else 0

            data.append({
                "transaction_id": t.id,
                "book_code": getattr(t.book, "book_code", None),
                "title": getattr(t.book, "title", None),
                "member_name": getattr(t.member, "username", None),
                "member_id": getattr(t.member, "id", None),
                "issue_date": t.issue_date,
                "due_date": t.due_date,
                "days_overdue": days_overdue,
                "fine_accumulated": str(t.fine_amount or Decimal("0.00")),
            })

        return paginator.get_paginated_response(data)


class OverdueReport(APIView):
    permission_classes = [IsAdminUser]
    pagination_class = AdminResultsSetPagination

    def get(self, request):
        today = timezone.now().date()
        min_days = int(request.query_params.get("min_days", 0))
        fine_rate = Decimal(getattr(settings, "LIBRARY_FINE_PER_DAY", 1))
        grace = getattr(settings, "LIBRARY_FINE_GRACE_DAYS", 0)

        qs = (
            BookTransaction.objects.filter(
                txn_type=BookTransaction.TYPE_ISSUE,
                is_active=True,
                due_date__lt=today,
                book__is_active=True,
            )
            .select_related("book", "member")
            .order_by("due_date")
        )

        if min_days > 0:
            cutoff = today - timedelta(days=min_days)
            qs = qs.filter(due_date__lte=cutoff)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)

        data = []
        for t in page:
            overdue_days = (today - t.due_date.date()).days
            est_fine = fine_rate * Decimal(max(0, overdue_days - grace))

            data.append({
                "transaction_id": t.id,
                "book_code": getattr(t.book, "book_code", None),
                "title": getattr(t.book, "title", None),
                "member_name": getattr(t.member, "username", None),
                "member_contact": getattr(t.member, "email", None),
                "due_date": t.due_date,
                "days_overdue": overdue_days,
                "estimated_fine": str(est_fine),
            })

        return paginator.get_paginated_response(data)


class MemberHistoryReport(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, member_id):
        if not (request.user.is_staff or request.user.id == int(member_id)):
            return Response({"detail": "Forbidden"}, status=403)

        qs = (
            BookTransaction.objects.filter(member_id=member_id)
            .select_related("book")
            .order_by("-created_at")
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)

        data = []
        for t in page:
            data.append({
                "member_name": getattr(t.member, "username", None),
                "book_code": getattr(t.book, "book_code", None),
                "title": getattr(t.book, "title", None),
                "issue_date": t.issue_date.date() if t.issue_date else None,
                "due_date": t.due_date.date() if t.due_date else None,
                "return_date": t.return_date.date() if t.return_date else None,
                "fine_paid": str(t.fine_amount or Decimal("0.00")),
                "status_on_return": t.txn_type,
                "remarks": t.remarks,
            })

        return paginator.get_paginated_response(data)


from django.core.cache import cache
from .tasks import recompute_dashboard_stats


class DashboardStats(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.core.cache import cache
        from .tasks import recompute_dashboard_stats

        cache_key = "ilas_dashboard_stats"
        data = cache.get(cache_key)

        if data is None:
            data = recompute_dashboard_stats()

        return Response(data)

        total_books = Book.objects.filter(is_active=True).count()
        issued_count = Book.objects.filter(status=Book.STATUS_ISSUED).count()
        overdue_count = BookTransaction.objects.filter(
            txn_type=BookTransaction.TYPE_ISSUE,
            is_active=True,
            due_date__lt=timezone.now(),
        ).count()
        unpaid_fines = (
            BookTransaction.objects.filter(is_active=True, fine_amount__gt=0)
            .aggregate(total=models.Sum("fine_amount"))["total"]
            or Decimal("0.00")
        )

        result = {
            "total_books": total_books,
            "issued_count": issued_count,
            "overdue_count": overdue_count,
            "total_unpaid_fines": str(unpaid_fines),
        }

        cache.set(cache_key, result, timeout=300)
        return Response(result)


# =========================================================
# NEW: ADMIN EXCEL EXPORTS
# =========================================================

class AdminBookExportView(APIView):
    """
    Export full / filtered book master data as Excel.
    Supports field selection and filters (including source).
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Book.objects.all().select_related("last_modified_by")

        # ---- Filters ----
        filters = {
            "title__icontains": request.query_params.get("title"),
            "author__icontains": request.query_params.get("author"),
            "category__icontains": request.query_params.get("category"),
            "shelf_location__icontains": request.query_params.get("shelf_location"),
            "source__icontains": request.query_params.get("source"),
        }

        for key, val in filters.items():
            if val:
                qs = qs.filter(**{key: val})

        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        is_active = request.query_params.get("is_active")
        if is_active in ["true", "false"]:
            qs = qs.filter(is_active=(is_active == "true"))

        # ---- Field selection ----
        fields_param = request.query_params.get("fields")
        if fields_param:
            fields = [f.strip() for f in fields_param.split(",")]
        else:
            fields = [
                "book_code",
                "title",
                "subtitle",
                "author",
                "publisher",
                "edition",
                "publication_year",
                "isbn",
                "language",
                "category",
                "keywords",
                "description",
                "accession_no",
                "shelf_location",
                "condition",
                "book_cost",
                "vendor_name",
                "source",
                "library_section",
                "dewey_decimal",
                "cataloger",
                "remarks",
                "status",
                "is_active",
                "created_at",
                "updated_at",
                "last_modified_by_name",
            ]

        # ---- Excel generation ----
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Books_Master"
        ws.append(fields)

        for book in qs:
            row = []
            for field in fields:
                val = getattr(book, field, "")
                if field in ["created_at", "updated_at"] and val:
                    val = localtime(val).strftime("%Y-%m-%d")
                row.append(val)
            ws.append(row)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="books_master.xlsx"'
        wb.save(response)
        return response


class AdminBookLogExportView(APIView):
    """
    Export book audit logs as Excel.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = AuditLog.objects.filter(target_type="Book").select_related("actor")

        book_code = request.query_params.get("book_code")
        actor = request.query_params.get("actor")
        action = request.query_params.get("action")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if book_code:
            qs = qs.filter(target_id__icontains=book_code)
        if actor:
            qs = qs.filter(actor__username__icontains=actor)
        if action:
            qs = qs.filter(action=action)
        if start_date:
            qs = qs.filter(timestamp__date__gte=start_date)
        if end_date:
            qs = qs.filter(timestamp__date__lte=end_date)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Book_Audit_Logs"

        headers = [
            "timestamp",
            "actor_username",
            "actor_name",
            "action",
            "book_code",
            "old_values",
            "new_values",
            "remarks",
            "source",
        ]
        ws.append(headers)

        for log in qs:
            ws.append([
                localtime(log.timestamp).strftime("%Y-%m-%d"),
                getattr(log.actor, "username", ""),
                getattr(log.actor, "get_full_name", lambda: "")(),
                log.action,
                log.target_id,
                json.dumps(log.old_values, ensure_ascii=False),
                json.dumps(log.new_values, ensure_ascii=False),
                log.remarks,
                log.source,
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="book_logs.xlsx"'
        wb.save(response)
        return response
