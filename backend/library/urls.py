# library/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as library_views

from .views import (
    BookViewSet,
    BookCopyViewSet,
    BarcodeReportView,
    BarcodeScanView,
    TransactionViewSet,
    ReportViewSet,
    AuditLogViewSet,
)

router = DefaultRouter()
router.register(r"books", BookViewSet, basename="book")
router.register(r"copies", BookCopyViewSet, basename="copy")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"audit", AuditLogViewSet, basename="audit")

urlpatterns = [
    path("", include(router.urls)),

    # Reports
    path("reports/books/", ReportViewSet.as_view({"get": "books"}), name="report-books"),
    path("reports/copies/", ReportViewSet.as_view({"get": "copies"}), name="report-copies"),
    path("reports/barcodes/", BarcodeReportView.as_view({"get": "list"}), name="report-barcodes"),
    path("reports/barcodes/single/<str:pk>/", BarcodeReportView.as_view({"get": "single"}), name="report-barcode-single"),

    # Admin summary (M5)
    path("reports/summary/", library_views.reports_summary, name="reports-summary"),

    # Barcode Scan
    path("scan-barcode/", BarcodeScanView.as_view(), name="barcode-scan"),

    # Analytics / Stats (M4)
    path("stats/overview/", library_views.stats_overview, name="stats-overview"),
    path("stats/trends/", library_views.stats_trends, name="stats-trends"),
    path("stats/category/", library_views.stats_category, name="stats-category"),
    path("stats/admin/", library_views.stats_admin_activity, name="stats-admin-activity"),
]
