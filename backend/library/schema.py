"""
ILAS – OpenAPI Schema & Interactive API Documentation
=====================================================

This file configures auto-generated API documentation using DRF Spectacular.
It provides:
✅ /api/schema/  → JSON OpenAPI schema (machine-readable)
✅ /api/docs/    → Swagger UI (interactive)
✅ /api/redoc/   → Redoc UI (read-only)

Notes:
------
• This documentation reflects your serializers, permissions, and viewsets.
• Protect the docs endpoints in production via admin/staff-only access.
• Fully compatible with your /api/v1/ routes.

Author: ILAS Dev Team
"""

from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework.permissions import IsAdminUser


# Optional: secure docs behind admin permission in production
class AdminOnlySwaggerView(SpectacularSwaggerView):
    permission_classes = [IsAdminUser]


class AdminOnlyRedocView(SpectacularRedocView):
    permission_classes = [IsAdminUser]


urlpatterns = [
    # Core OpenAPI schema (JSON)
    path("api/schema/", SpectacularAPIView.as_view(), name="openapi-schema"),

    # Interactive Swagger UI
    path("api/docs/", AdminOnlySwaggerView.as_view(url_name="openapi-schema"), name="swagger-ui"),

    # Alternate clean Redoc UI
    path("api/redoc/", AdminOnlyRedocView.as_view(url_name="openapi-schema"), name="redoc-ui"),
]
