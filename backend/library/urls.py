# library/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
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

    # Barcode Scan
    path("scan-barcode/", BarcodeScanView.as_view(), name="barcode-scan"),
]
