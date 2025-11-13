# library/views_reports.py
from datetime import timedelta
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import models

from .models import Book, BookTransaction
from .pagination import StandardResultsSetPagination, AdminResultsSetPagination


class ActiveIssuesReport(APIView):
    permission_classes = [IsAdminUser]  # restrict to admin only
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
        # Security: allow only same member or admin
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

class DashboardStats(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = "ilas_dashboard_stats"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

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

        # Cache for 5 minutes
        cache.set(cache_key, result, timeout=300)
        return Response(result)

