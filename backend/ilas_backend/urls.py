# backend/ilas_backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # Keep login & register working as before
    path("api/auth/", include("accounts.urls")),

    # Mirror members endpoints under /api/members/ etc.
    path("api/", include("accounts.urls")),

    # Library routes
    path("api/library/", include("library.urls")),
]
