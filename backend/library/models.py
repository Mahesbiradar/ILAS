"""
Final stabilized models.py (ILAS Backend)
----------------------------------------
Includes:
 - Book, BookTransaction, AuditLog
 - Safe save() without recursive signal triggers
 - _suppress_audit handling for bulk upload & admin saves
 - Unified create_audit() helper
"""

from __future__ import annotations
import uuid
import logging
from datetime import timedelta
from decimal import Decimal
from typing import Optional, Dict, Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# AUDIT LOG MODEL
# ----------------------------------------------------------------------
class AuditLog(models.Model):
    ACTION_BOOK_ADD = "BOOK_ADD"
    ACTION_BOOK_EDIT = "BOOK_EDIT"
    ACTION_BOOK_DELETE = "BOOK_DELETE"
    ACTION_BOOK_ISSUE = "BOOK_ISSUE"
    ACTION_BOOK_RETURN = "BOOK_RETURN"
    ACTION_STATUS_CHANGE = "STATUS_CHANGE"
    ACTION_BULK_UPLOAD = "BULK_UPLOAD"

    ACTION_CHOICES = (
        (ACTION_BOOK_ADD, "Book added"),
        (ACTION_BOOK_EDIT, "Book edited"),
        (ACTION_BOOK_DELETE, "Book deleted"),
        (ACTION_BOOK_ISSUE, "Book issued"),
        (ACTION_BOOK_RETURN, "Book returned"),
        (ACTION_STATUS_CHANGE, "Book status changed"),
        (ACTION_BULK_UPLOAD, "Bulk upload"),
    )

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=64, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=200)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    remarks = models.TextField(blank=True, default="")
    source = models.CharField(max_length=64, blank=True, default="system")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-timestamp",)

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.action} - {self.target_type}:{self.target_id}"


def create_audit(
    actor,
    action: str,
    target_type: str,
    target_id: str,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    remarks: str = "",
    source: str = "system",
):
    """Safe audit helper with logging on failure."""
    try:
        User = get_user_model()
        actor_obj = actor if isinstance(actor, User) else User.objects.filter(pk=actor).first()
        return AuditLog.objects.create(
            actor=actor_obj,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            old_values=old_values,
            new_values=new_values,
            remarks=remarks or "",
            source=source or "system",
        )
    except Exception as ex:
        logger.exception("create_audit failed for target=%s action=%s: %s", target_id, action, ex)
        return None

# ----------------------------------------------------------------------
# BOOK MODEL
# ----------------------------------------------------------------------
class Book(models.Model):
    id = models.BigAutoField(primary_key=True)
    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    book_code = models.CharField(max_length=32, unique=True, blank=True, db_index=True)

    title = models.CharField(max_length=512)
    subtitle = models.CharField(max_length=512, blank=True, default="", null=True)
    author = models.CharField(max_length=400)
    publisher = models.CharField(max_length=256, blank=True, default="", null=True)
    edition = models.CharField(max_length=64, blank=True, default="", null=True)
    publication_year = models.IntegerField(blank=True, null=True)
    isbn = models.CharField(max_length=64, db_index=True)
    language = models.CharField(max_length=64, blank=True, default="English", null=True)
    category = models.CharField(max_length=128)
    keywords = models.CharField(max_length=512, blank=True, default="", null=True)
    description = models.TextField(blank=True, default="", null=True)

    accession_no = models.CharField(max_length=128, blank=True, null=True)
    shelf_location = models.CharField(max_length=128)
    condition = models.CharField(max_length=64, blank=True, default="Good", null=True)
    book_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vendor_name = models.CharField(max_length=256, blank=True, default="", null=True)
    source = models.CharField(max_length=256, blank=True, default="", null=True)
    library_section = models.CharField(max_length=128, blank=True, default="", null=True)
    dewey_decimal = models.CharField(max_length=64, blank=True, default="", null=True)
    cataloger = models.CharField(max_length=128, blank=True, default="", null=True)
    remarks = models.TextField(blank=True, default="", null=True)

    cover_image = models.ImageField(upload_to="book_covers/", null=True, blank=True)

    STATUS_AVAILABLE = "AVAILABLE"
    STATUS_ISSUED = "ISSUED"
    STATUS_LOST = "LOST"
    STATUS_DAMAGED = "DAMAGED"
    STATUS_MAINTENANCE = "MAINTENANCE"
    STATUS_REMOVED = "REMOVED"

    STATUS_CHOICES = (
        (STATUS_AVAILABLE, "Available"),
        (STATUS_ISSUED, "Issued"),
        (STATUS_LOST, "Lost"),
        (STATUS_DAMAGED, "Damaged"),
        (STATUS_MAINTENANCE, "Maintenance"),
        (STATUS_REMOVED, "Removed"),
    )

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_AVAILABLE, db_index=True)
    issued_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="issued_books"
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="modified_books"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.book_code or '(no-code)'} — {self.title}"

    # ------------------------------------------------------------------
    # Safe save() (non-recursive)
    # ------------------------------------------------------------------
    def save(self, *args, **kwargs):
        creating = self.pk is None

        # Prevent audit trigger until BookCode assigned
        if creating and not getattr(self, "_suppress_audit", False):
            self._suppress_audit = True

        super().save(*args, **kwargs)

        # Assign book code after first save
        if creating and not self.book_code:
            code = f"ILAS-ET-{self.pk:04d}"
            Book.objects.filter(pk=self.pk).update(book_code=code)
            self.book_code = code

        # Do NOT create audits here — handled in signals
        # This avoids reentrant saves during admin actions

    # ------------------------------------------------------------------
    # Business Logic
    # ------------------------------------------------------------------
    def can_be_issued(self) -> bool:
        return self.status == self.STATUS_AVAILABLE and self.is_active

    def _get_default_loan_days(self, member) -> int:
        return 15

    def mark_issued(self, member, actor=None, remarks=""):
        if not self.can_be_issued():
            raise ValueError("Book is not available for issue.")

        limit = getattr(settings, "LIBRARY_MAX_ACTIVE_LOANS", 5)
        if member and BookTransaction.objects.filter(member=member, txn_type="ISSUE", is_active=True).count() >= limit:
            raise ValueError(f"Member has reached max active loans ({limit}).")

        issue_date = timezone.now()
        due_date = issue_date + timedelta(days=self._get_default_loan_days(member))

        with transaction.atomic():
            Book.objects.select_for_update().get(pk=self.pk)
            if BookTransaction.objects.filter(book=self, txn_type="ISSUE", is_active=True).exists():
                raise ValueError("Book already issued.")

            txn = BookTransaction.objects.create(
                book=self, member=member, actor=actor, txn_type="ISSUE",
                issue_date=issue_date, due_date=due_date, is_active=True, remarks=remarks
            )

            self.status = self.STATUS_ISSUED
            self.issued_to = member
            self.last_modified_by = actor
            self.save(update_fields=["status", "issued_to", "last_modified_by", "updated_at"])

            create_audit(actor, AuditLog.ACTION_BOOK_ISSUE, "Book", self.book_code,
                         new_values={"issued_to": getattr(member, "username", None),
                                     "due_date": due_date.isoformat()},
                         remarks=remarks, source="system")
            return txn

    def mark_returned(self, actor=None, remarks=""):
        with transaction.atomic():
            active_issue = BookTransaction.objects.select_for_update().filter(
                book=self, txn_type="ISSUE", is_active=True
            ).first()
            if not active_issue:
                raise ValueError("No active issue.")

            fine = Decimal("0.00")
            if active_issue.due_date and timezone.now().date() > active_issue.due_date.date():
                grace = getattr(settings, "LIBRARY_FINE_GRACE_DAYS", 0)
                overdue_days = max(0, (timezone.now().date() - active_issue.due_date.date()).days - grace)
                fine = Decimal(overdue_days)

            active_issue.is_active = False
            active_issue.return_date = timezone.now()
            active_issue.fine_amount = fine
            active_issue.save(update_fields=["is_active", "return_date", "fine_amount"])

            new_txn = BookTransaction.objects.create(
            book=self, member=active_issue.member, actor=actor,
            txn_type="RETURN", issue_date=active_issue.issue_date,
            due_date=active_issue.due_date, fine_amount=fine,
            return_date=timezone.now(), is_active=False, remarks=remarks
            )

            self.status = self.STATUS_AVAILABLE
            self.issued_to = None
            self.last_modified_by = actor
            self.save(update_fields=["status", "issued_to", "last_modified_by", "updated_at"])

            create_audit(actor, AuditLog.ACTION_BOOK_RETURN, "Book", self.book_code,
                        new_values={"fine": str(fine)}, remarks=remarks, source="system")
            return new_txn

    
    def mark_status(self, status_type, actor=None, remarks=""):
            """
            Change book status (Lost / Damaged / Maintenance / Removed)
            Creates transaction and audit record.
            """
            valid_status = {
                "LOST": self.STATUS_LOST,
                "DAMAGED": self.STATUS_DAMAGED,
                "MAINTENANCE": self.STATUS_MAINTENANCE,
                "REMOVED": self.STATUS_REMOVED,
            }
            if status_type not in valid_status:
                raise ValueError(f"Invalid status type: {status_type}")

            with transaction.atomic():
                self.status = valid_status[status_type]
                self.last_modified_by = actor
                self.save(update_fields=["status", "last_modified_by", "updated_at"])

                BookTransaction.objects.create(
                    book=self,
                    member=self.issued_to,
                    actor=actor,
                    txn_type=status_type,
                    remarks=remarks,
                    is_active=False,
                )

                create_audit(
                    actor=actor,
                    action=AuditLog.ACTION_STATUS_CHANGE,
                    target_type="Book",
                    target_id=self.book_code,
                    new_values={"status": status_type},
                    remarks=remarks,
                    source="system",
                )


# ----------------------------------------------------------------------
# BOOK TRANSACTION MODEL
# ----------------------------------------------------------------------
class BookTransaction(models.Model):
    # Constants for transaction types (used in tests and signals)
    TYPE_ISSUE = "ISSUE"
    TYPE_RETURN = "RETURN"
    TYPE_LOST = "LOST"
    TYPE_DAMAGED = "DAMAGED"
    TYPE_MAINTENANCE = "MAINTENANCE"
    TYPE_REMOVED = "REMOVED"


    TYPE_CHOICES = (
        ("ISSUE", "Issue"),
        ("RETURN", "Return"),
        ("LOST", "Lost"),
        ("DAMAGED", "Damaged"),
        ("MAINTENANCE", "Maintenance"),
        ("REMOVED", "Removed"),
    )

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="transactions")
    member = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                               on_delete=models.SET_NULL, related_name="book_transactions")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                              on_delete=models.SET_NULL, related_name="acted_transactions")

    txn_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    issue_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    return_date = models.DateTimeField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2,
                                      default=Decimal("0.00"),
                                      validators=[MinValueValidator(Decimal("0.00"))])
    remarks = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["book", "txn_type", "is_active"], name="txn_book_type_active_idx"),
        ]

    def __str__(self):
        return f"{self.txn_type} - {self.book.title if self.book else 'n/a'}"

    def save(self, *args, **kwargs):
        if self.txn_type != "ISSUE":
            self.is_active = False
        super().save(*args, **kwargs)
