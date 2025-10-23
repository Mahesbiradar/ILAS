# backend/accounts/permissions.py
from rest_framework.permissions import BasePermission

class IsRealAdmin(BasePermission):
    """
    Custom permission to allow both Django admin users and
    app-level admins (role='admin') to access restricted endpoints.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_staff or user.role == "admin")
        )
