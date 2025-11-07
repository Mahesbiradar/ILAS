from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import send_reset_otp, reset_password  
from .views import upload_profile_image, change_password

from .views import (
    RegisterView, LoginView, UserProfileView,
    UserListView, UserDetailView,
    MemberViewSet, member_logs, export_member_logs , export_all_members, reset_password,
)

# Router for members ViewSet
router = DefaultRouter()
router.register(r"members", MemberViewSet, basename="members")

urlpatterns = [
    # --- Authentication routes ---
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # --- Admin-only user routes ---
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),

    # --- Custom member management routes (moved above router include) ---
    path("members/logs/", member_logs, name="member-logs"),
    path("members/export/", export_member_logs, name="export-member-logs"),
    path("members/export/all/", export_all_members, name="export-all-members"),

    # add these into your existing urlpatterns list
    path("password/send-otp/", send_reset_otp, name="password-send-otp"),
    path("password/reset/", reset_password, name="password-reset"),

    path("me/upload/", upload_profile_image, name="upload-profile-image"),
    path("me/change-password/", change_password, name="change-password"),




    # --- Router ViewSet routes ---
    path("", include(router.urls)),
]
