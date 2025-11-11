from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Read-only for unauthenticated/normal users. Write access for admin users.
    Admin determination uses Django flags (is_staff/is_superuser) or a custom
    'role' attribute on the user model (role == 'admin').
    """

    def has_permission(self, request, view):
        # Safe methods always allowed
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # Django standard admin flags
        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        # Optional custom role field
        role = getattr(user, "role", None)
        if isinstance(role, str) and role.lower() == "admin":
            return True

        return False
