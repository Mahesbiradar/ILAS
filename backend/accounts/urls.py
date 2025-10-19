from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    UserListView,
    UserDetailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Admin routes
    path("userlist/", UserListView.as_view(), name="user-list"),
    path("user/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
