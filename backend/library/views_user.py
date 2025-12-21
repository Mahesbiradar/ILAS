# library/views_user.py
from datetime import datetime, timezone as dt_timezone
from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import BookTransaction
from .serializers import BookTransactionSerializer
from .pagination import StandardResultsSetPagination


# ----------------------------------------------------------
# Local helper: parse_date_param (safe fallback)
# ----------------------------------------------------------
def parse_date_param(qs, key: str):
    """Parse ?start_date=YYYY-MM-DD or ISO formats safely."""
    val = qs.get(key)
    if not val:
        return None
    try:
        # Try ISO format
        return datetime.fromisoformat(val).replace(tzinfo=dt_timezone.utc)
    except Exception:
        try:
            # Try YYYY-MM-DD
            return datetime.strptime(val, "%Y-%m-%d").replace(tzinfo=dt_timezone.utc)
        except Exception:
            return None


# ----------------------------------------------------------
# USER DASHBOARD API
# ----------------------------------------------------------
class UserDashboardAPIView(APIView):
    """
    GET /api/v1/library/user/dashboard/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Active issues
        active_qs = BookTransaction.objects.filter(
            member=user,
            txn_type=BookTransaction.TYPE_ISSUE,
            is_active=True
        )
        active_count = active_qs.count()

        # Returned
        returned_count = BookTransaction.objects.filter(
            member=user,
            txn_type=BookTransaction.TYPE_RETURN
        ).count()

        # Overdue
        now = timezone.now()
        overdue_count = active_qs.filter(due_date__lt=now).count()

        # Last 5 transactions
        last_qs = (
            BookTransaction.objects
            .select_related("book", "actor")
            .filter(member=user)
            .order_by("-created_at")[:5]
        )
        serializer = BookTransactionSerializer(last_qs, many=True, context={"request": request})

        return Response({
            "active_count": active_count,
            "returned_count": returned_count,
            "overdue_count": overdue_count,
            "last_transactions": serializer.data
        }, status=200)


# ----------------------------------------------------------
# USER TRANSACTION HISTORY API
# ----------------------------------------------------------
class UserTransactionHistoryAPIView(APIView):
    """
    GET /api/v1/library/user/transactions/
    Supports:
      - txn_type=ISSUE/RETURN
      - start_date
      - end_date
      - search
      - pagination
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        user = request.user

        qs = (
            BookTransaction.objects
            .select_related("book", "actor")
            .filter(member=user)
            .order_by("-created_at")
        )

        # Filter by txn_type
        txn_type = request.query_params.get("txn_type")
        if txn_type:
            qs = qs.filter(txn_type__iexact=txn_type)

        # Search by title, isbn, book_code
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(book__title__icontains=search)
                | Q(book__isbn__icontains=search)
                | Q(book__book_code__icontains=search)
            )

        # Date filters
        start = parse_date_param(request.query_params, "start_date")
        end = parse_date_param(request.query_params, "end_date")
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = BookTransactionSerializer(page, many=True, context={"request": request})

        return paginator.get_paginated_response(serializer.data)
