# library/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as library_views
from .views import (
    BookViewSet,
    BookCopyViewSet,
    ReportViewSet,
    AuditLogViewSet,
)

# ----------------------------------------------------------------------
# 🔹 Router Registration
# ----------------------------------------------------------------------
router = DefaultRouter()
router.register(r"books", BookViewSet, basename="book")
router.register(r"bookcopies", BookCopyViewSet, basename="bookcopy")
router.register(r"audit", AuditLogViewSet, basename="audit")

# ----------------------------------------------------------------------
# 🔹 URL Patterns
# ----------------------------------------------------------------------
urlpatterns = [
    # Default REST routes
    path("", include(router.urls)),

    # ✅ Nested Route for Book → Copies
    path(
        "books/<str:book_code>/copies/",
        BookCopyViewSet.as_view({"get": "list"}),
        name="book-copies",
    ),

    # ---------------- Reports ----------------
    path(
        "reports/books/",
        ReportViewSet.as_view({"get": "books"}),
        name="report-books",
    ),
    path(
        "reports/summary/",
        library_views.reports_summary,
        name="reports-summary",
    ),

    # ---------------- Analytics / Stats ----------------
    path("stats/overview/", library_views.stats_overview, name="stats-overview"),
    path("stats/category/", library_views.stats_category, name="stats-category"),

    path("reports/books/csv/", library_views.export_books_csv, name="report-books-csv"),
    path("reports/inventory/summary/", library_views.export_inventory_summary, name="report-inventory-summary"),

]


