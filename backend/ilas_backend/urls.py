from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Authentication routes
    path("api/auth/", include("accounts.urls")),

    # Mirror accounts routes (for members, etc.)
    path("api/", include("accounts.urls")),

    # Library routes
    path("api/library/", include("library.urls")),
]

# ✅ Serve uploaded images and barcodes during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
