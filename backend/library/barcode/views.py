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

        if not raw_text.strip():
            return HttpResponse(
                "No data provided",
                status=400,
                content_type="text/plain",
            )

        pdf_buffer = generate_barcode_pdf(raw_text)

        response = HttpResponse(
            pdf_buffer,
            content_type="application/pdf",
        )
        response["Content-Disposition"] = (
            'attachment; filename="barcodes.pdf"'
        )

        return response
