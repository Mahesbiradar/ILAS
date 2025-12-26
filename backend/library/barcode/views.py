from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser

from .generator import generate_barcode_pdf


class BulkBarcodeGenerateView(APIView):
    permission_classes = [IsAdminUser]

    @method_decorator(csrf_exempt)
    def post(self, request):
        raw_text = request.data.get("data", "")
        page_size = request.data.get("page_size", "A4")  # ✅ NEW

        if not raw_text.strip():
            return HttpResponse(
                "No data provided",
                status=400,
                content_type="text/plain",
            )

        # ✅ Pass page_size to generator
        pdf_buffer = generate_barcode_pdf(raw_text, page_size)

        response = HttpResponse(
            pdf_buffer,
            content_type="application/pdf",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="barcodes_{page_size}.pdf"'
        )

        return response
