# backend/accounts/urls.py
from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView,
    UserListView, UserDetailView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Admin-only
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
