# backend/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random
import string
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("librarian", "Librarian"),
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("user", "User"),
    )

    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True,
        default=None
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")

    # Single unique identifier for transactions: USN (students) or Employee ID (teachers)
    unique_id = models.CharField(max_length=50, unique=True, null=True, blank=True)

    # Institutional info
    department = models.CharField(max_length=100, blank=True, null=True)
    year = models.CharField(max_length=20, blank=True, null=True)  # for students, e.g., "3rd Year"
    designation = models.CharField(max_length=100, blank=True, null=True)  # for teachers

    # Contact
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(unique=True)

    is_verified = models.BooleanField(default=False)
    is_logged_in = models.BooleanField(default=False)

    def __str__(self):
        uid = self.unique_id or self.username
        return f"{self.username} ({self.role}) - {uid}"


class PasswordResetOTP(models.Model):
    """
    Simple OTP model for password reset without external dependencies.
    - OTP is numeric (6 digits)
    - Valid for `EXPIRY_MINUTES` (default 10)
    - is_used prevents reuse
    """
    EXPIRY_MINUTES = 10

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_otps")
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["otp_code"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"OTP for {self.user.username} (used={self.is_used})"

    @classmethod
    def generate_otp(cls, digits=6):
        # numeric OTP
        return "".join(random.choices(string.digits, k=digits))

    def is_valid(self):
        """OTP valid if not used and within expiry window."""
        if self.is_used:
            return False
        return timezone.now() - self.created_at < timedelta(minutes=self.EXPIRY_MINUTES)

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used"])


# 🧾 Member Logs Model (unchanged, kept for admin audit)
class MemberLog(models.Model):
    ACTIONS = [
        ("added", "Added"),
        ("edited", "Edited"),
        ("deleted", "Deleted"),
        ("promoted", "Promoted"),
    ]
    member = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=ACTIONS)
    performed_by = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member} - {self.action} by {self.performed_by}"



