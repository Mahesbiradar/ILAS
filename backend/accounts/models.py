# backend/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('librarian', 'Librarian'),
        ('user', 'User'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=15, blank=True, null=True)
    usn = models.CharField(max_length=20, blank=True, null=True)
    is_logged_in = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"


# 🧾 Member Logs Model
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
