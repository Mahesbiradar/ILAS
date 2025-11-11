# library/urls.py
"""
ILAS Final – Library URL Configuration (Single-Book Model)
----------------------------------------------------------
Routes:
- /books/                 → Book CRUD + search + bulk upload
- /transactions/issue/    → Issue Book
- /transactions/return/   → Return Book
- /transactions/status/   → Lost/Damaged/Maintenance/Available
- /reports/<type>/        → Master / Transaction / Inventory
- /admin/*search/         → Admin AJAX book & user search, active transactions
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    IssueBookAPIView,
    ReturnBookAPIView,
    UpdateBookStatusAPIView,
    MasterReportView,
    TransactionReportView,
    InventoryReportView,
    admin_search_books,
    admin_search_users,
    admin_active_transactions,
)

# ----------------------------------------------------------
# Router for Book CRUD and bulk upload
# ----------------------------------------------------------
router = DefaultRouter()
router.register(r"books", BookViewSet, basename="book")

# ----------------------------------------------------------
# URL Patterns
# ----------------------------------------------------------
urlpatterns = [
    # Core Book CRUD
    path("", include(router.urls)),

    # New modular apps
    # path("api/", include("library.books.urls")),
    # path("api/", include("library.transactions.urls")),

    # Transactions
    path("transactions/issue/", IssueBookAPIView.as_view(), name="transaction-issue"),
    path("transactions/return/", ReturnBookAPIView.as_view(), name="transaction-return"),
    path("transactions/status/", UpdateBookStatusAPIView.as_view(), name="transaction-status"),

    # Reports
    path("reports/master/", MasterReportView.as_view(), name="report-master"),
    path("reports/transactions/", TransactionReportView.as_view(), name="report-transactions"),
    path("reports/inventory/", InventoryReportView.as_view(), name="report-inventory"),

    # Admin AJAX Endpoints
    path("admin/book-search/", admin_search_books, name="admin-book-search"),
    path("admin/user-search/", admin_search_users, name="admin-user-search"),
    path("admin/active-transactions/", admin_active_transactions, name="admin-active-transactions"),
]
