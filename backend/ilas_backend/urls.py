# backend/ilas_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from library.views_task_status import task_status_view

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),

    # Authentication routes
    path("api/auth/", include("accounts.urls")),

    # ✅ Library API routes (root-level for frontend compatibility)
    path("api/", include("library.urls")),

    # ✅ Celery task status endpoint
    path("api/tasks/status/<str:task_id>/", task_status_view, name="task-status"),
]

# ✅ Serve uploaded images, barcodes, and reports during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
