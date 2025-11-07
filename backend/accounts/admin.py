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


@admin.register(MemberLog)
class MemberLogAdmin(admin.ModelAdmin):
    list_display = ("member", "action", "performed_by", "timestamp")
    ordering = ("-timestamp",)
    search_fields = ("member", "performed_by", "action")


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "otp_code", "created_at", "is_used")
    readonly_fields = ("created_at",)
    list_filter = ("is_used",)
