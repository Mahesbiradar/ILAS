from django.urls import path
from .views import BulkBarcodeGenerateView

urlpatterns = [
    path(
        "generate/",
        BulkBarcodeGenerateView.as_view(),
        name="bulk-barcode-generate",
    ),
]
