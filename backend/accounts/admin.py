# backend/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, MemberLog, PasswordResetOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Institutional Info", {"fields": ("role", "unique_id", "department", "year", "designation")}),
        ("Contact / System", {"fields": ("phone", "is_verified", "is_logged_in")}),
    )
    list_display = ("username", "email", "role", "unique_id", "is_active", "is_staff")
    list_filter = ("role", "is_staff", "is_active", "is_verified")
    search_fields = ("username", "email", "unique_id", "department")


from django.contrib import admin
from .models import MemberLog

@admin.register(MemberLog)
class MemberLogAdmin(admin.ModelAdmin):
    list_display = (
        "member_username",
        "member_email",
        "member_role",
        "member_unique_id",
        "action",
        "performed_by",
        "timestamp",
    )

    list_filter = ("action", "member_role")
    search_fields = (
        "member_username",
        "member_email",
        "member_unique_id",
        "performed_by",
    )



@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "otp_code", "created_at", "is_used")
    readonly_fields = ("created_at",)
    list_filter = ("is_used",)
