from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from library.views_task_status import task_status_view


urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Authentication routes
    path("api/auth/", include("accounts.urls")),

    # Mirror accounts routes (for members, etc.)
    path("api/", include("accounts.urls")),

    # Library routes
    path("api/library/", include("library.urls")),

    path("api/tasks/status/<str:task_id>/", task_status_view, name="task-status"),
]

# ✅ Serve uploaded images and barcodes during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
