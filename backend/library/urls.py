# library/urls.py
"""
ILAS – Final URL Configuration (v1 API)
=======================================

This configuration implements:
✅ API versioning (`/api/v1/`)
✅ Public/Admin route separation
✅ Scoped throttling for heavy endpoints
✅ Namespaced router for scalability
✅ Health check + OpenAPI documentation

Structure:
----------
/api/v1/
    ├── library/books/               → CRUD + bulk upload
    ├── transactions/issue/          → Issue Book
    ├── transactions/return/         → Return Book (validated)
/api/v1/admin/
    ├── reports/active-issues/       → Admin Reports
    ├── dashboard/stats/             → Admin Dashboard
/api/v1/public/
    ├── books/                       → Public catalog
    ├── lookup/<book_code>/          → Barcode lookup
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse
from library import schema
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView



# Import views
from .views import (
    BookViewSet,
    IssueBookAPIView,
    LibraryMetaAPIView,
    ReturnBookAPIView,
    UpdateBookStatusAPIView,
    MasterReportView,
    TransactionReportView,
    InventoryReportView,
    AdminBookSearchView,
    AdminUserSearchView,
    AdminActiveTransactionsView,
    BookLookupView,
    ActiveTransactionsView,
    AllTransactionsView,
    PublicBookListView,
)
from .views_reports import (
    ActiveIssuesReport,
    OverdueReport,
    MemberHistoryReport,
    DashboardStats,
)

from .views_user import UserDashboardAPIView, UserTransactionHistoryAPIView


# ----------------------------------------------------------
# Health check (for container orchestration readiness probes)
# ----------------------------------------------------------
def health_check(request):
    return JsonResponse({"status": "ok", "service": "ILAS Library Backend"})

# ----------------------------------------------------------
# Router (with namespace)
# ----------------------------------------------------------
router = DefaultRouter()
router.register(r"books", BookViewSet, basename="books")

# ----------------------------------------------------------
# Public routes (accessible without login)
# ----------------------------------------------------------
public_patterns = [
    path("books/", PublicBookListView.as_view(), name="public-book-list"),
    path("lookup/<str:book_code>/", BookLookupView.as_view(), name="book-lookup"),
    path("meta/", LibraryMetaAPIView.as_view(), name="library-meta")

]

# ----------------------------------------------------------
# Admin & staff routes (restricted access)
# ----------------------------------------------------------
admin_patterns = [
    # Transactions
    path("transactions/issue/", IssueBookAPIView.as_view(), name="transaction-issue"),
    path("transactions/return/", ReturnBookAPIView.as_view(), name="transaction-return"),
    path("transactions/status/", UpdateBookStatusAPIView.as_view(), name="transaction-status"),

    # Reports
    path("reports/master/", MasterReportView.as_view(), name="report-master"),
    path("reports/transactions/", TransactionReportView.as_view(), name="report-transactions"),
    path("reports/inventory/", InventoryReportView.as_view(), name="report-inventory"),
    path("reports/active-issues/", ActiveIssuesReport.as_view(), name="reports-active-issues"),
    path("reports/overdue/", OverdueReport.as_view(), name="reports-overdue"),
    path("reports/member/<int:member_id>/history/", MemberHistoryReport.as_view(), name="reports-member-history"),

    # Dashboard
    path("dashboard/stats/", DashboardStats.as_view(), name="dashboard-stats"),

    # Admin AJAX
    path("ajax/book-search/", AdminBookSearchView.as_view(), name="admin-book-search"),
    path("ajax/user-search/", AdminUserSearchView.as_view(), name="admin-user-search"),
    path("ajax/active-transactions/", AdminActiveTransactionsView.as_view(), name="admin-active-transactions"),

    # Active transactions list (used by admin panel)
    path("transactions/active/", ActiveTransactionsView.as_view(), name="active-transactions"),
    path("transactions/all/", AllTransactionsView.as_view(), name="transactions-all"),


]

# ----------------------------------------------------------
# Root API URL Patterns (Versioned)
# ----------------------------------------------------------
urlpatterns = [
    # Health check (for monitoring)
    path("api/health/", health_check, name="health-check"),

    # Main API version (v1)
    path("api/v1/library/", include((router.urls, "library"), namespace="library")),
    path("api/v1/public/", include((public_patterns, "public"))),
    path("api/v1/admin/", include((admin_patterns, "admin"))),
    
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc-ui"),

   # USER DASHBOARD & TRANSACTIONS (Correct API-prefixed URLs)
    path("api/v1/library/user/dashboard/", UserDashboardAPIView.as_view(), name="user-dashboard"),
    path("api/v1/library/user/transactions/", UserTransactionHistoryAPIView.as_view(), name="user-transactions"),

    path("api/v1/library/barcodes/", include("library.barcode.urls")),


    ]
