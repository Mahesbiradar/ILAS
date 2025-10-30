# library/permissions.py
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Read-only for unauthenticated/normal users. Write access for admin users.
    Admin check uses is_staff/is_superuser or request.user.role == 'admin'.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # Support common Django flags
        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        # Support custom user.role field if present
        if getattr(user, "role", "").lower() == "admin":
            return True

        return False
