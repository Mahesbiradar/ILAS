# library/models.py (updated)
from __future__ import annotations
import uuid
import logging
from datetime import timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, Union

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


# ----------------------------------------------------------------------
# AuditLog model & helper (unchanged, kept for context)
# ----------------------------------------------------------------------
class AuditLog(models.Model):
    ACTION_BOOK_ADD = "BOOK_ADD"
    ACTION_BOOK_EDIT = "BOOK_EDIT"
    ACTION_BOOK_DELETE = "BOOK_DELETE"
    ACTION_BOOK_ISSUE = "BOOK_ISSUE"
    ACTION_BOOK_RETURN = "BOOK_RETURN"
    ACTION_STATUS_CHANGE = "STATUS_CHANGE"
    ACTION_BULK_UPLOAD = "BULK_UPLOAD"
    ACTION_FINE_PAYMENT = "FINE_PAYMENT"

    ACTION_CHOICES = (
        (ACTION_BOOK_ADD, "Book added"),
        (ACTION_BOOK_EDIT, "Book edited"),
        (ACTION_BOOK_DELETE, "Book deleted"),
        (ACTION_BOOK_ISSUE, "Book issued"),
        (ACTION_BOOK_RETURN, "Book returned"),
        (ACTION_STATUS_CHANGE, "Book status changed"),
        (ACTION_BULK_UPLOAD, "Bulk upload"),
        (ACTION_FINE_PAYMENT, "Fine payment"),
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
    """Safe audit creation: logs exception but does not raise."""
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
# Book model
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
    category = models.CharField(max_length=128,db_index=True)
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
    is_active = models.BooleanField(default=True,db_index=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.book_code or '(no-code)'} — {self.title}"

    # --- Save behaviour:
    # Keep the pattern: auto-generate book_code after initial save using update() to avoid double-save signal recursion.
    def save(self, *args, **kwargs):
        creating = self.pk is None
        if not creating and not hasattr(self, "_previous_state"):
            self._previous_state = (
                Book.objects.filter(pk=self.pk)
                .values("title", "isbn", "status")
                .first()
            ) or {}
        # NOTE: callers may set _suppress_audit on the instance to avoid immediate audit creation by signals;
        # we do not force that flag here — it must be set by the caller when needed.
        super().save(*args, **kwargs)
        # Post-create: ensure a canonical book_code exists. Use update() to avoid triggering additional model save signals.
        if creating and not self.book_code:
            code = f"ILAS-ET-{self.pk:04d}"
            Book.objects.filter(pk=self.pk).update(book_code=code)
            # keep the field on the in-memory instance for immediate use
            self.book_code = code

    # Business helpers
    def can_be_issued(self) -> bool:
        return self.status == self.STATUS_AVAILABLE and self.is_active

    def _member_loan_days(self, member) -> int:
        """R1.04: student 14, faculty 60. Adjust according to member attributes."""
        try:
            member_type = getattr(member, "member_type", None)
            if member_type and str(member_type).lower() == "faculty":
                return 60
            if getattr(member, "is_staff", False) or getattr(member, "is_faculty", False):
                return 60
        except Exception:
            pass
        return 14

    def mark_issued(self, member, actor=None, remarks=""):
        """
        Implements R1.01-R1.04.
        Creates an ISSUE transaction and updates book status, with atomic locking to prevent races.
        """
        if member is None or not getattr(member, "is_active", True):
            raise ValueError("Member is not active.")

        limit = getattr(settings, "LIBRARY_MAX_ACTIVE_LOANS", 5)

        with transaction.atomic():
            # Lock the book row first to prevent two concurrent issuances
            Book.objects.select_for_update().get(pk=self.pk)

            # re-check availability and active issue under lock
            if not self.can_be_issued():
                raise ValueError("Book is not available for issue.")

            from django.db.models import Q

            if BookTransaction.objects.filter(book=self, txn_type=BookTransaction.TYPE_ISSUE, is_active=True).exists():
                raise ValueError("Book already has an active issue transaction.")

            if BookTransaction.objects.filter(member=member, txn_type=BookTransaction.TYPE_ISSUE, is_active=True).count() >= limit:
                raise ValueError(f"Member has reached max active loans ({limit}).")

            issue_date = timezone.now()
            due_date = issue_date + timedelta(days=self._member_loan_days(member))

            # Create the issue transaction (is_active=True)
            txn = BookTransaction.objects.create(
                book=self,
                member=member,
                actor=actor,
                txn_type=BookTransaction.TYPE_ISSUE,
                issue_date=issue_date,
                due_date=due_date,
                is_active=True,
                remarks=remarks,
            )

            # update book state and persist
            self.status = self.STATUS_ISSUED
            self.issued_to = member
            self.last_modified_by = actor
            # update_fields avoids touching other fields
            self.save(update_fields=["status", "issued_to", "last_modified_by", "updated_at"])
            return txn

    def mark_returned(self, actor=None, returned_by: Optional[Union[int, object]] = None, remarks=""):
        """
        Handle book return with validations and fine calculation (R2).
        Parameters:
            actor: the user performing the return (must be provided)
            returned_by: optional - the user (or user id) who originally held the book (if actor is staff)
        Rules:
            - If actor is not staff, actor must match the active issue member (R2.02)
            - If actor is staff and returned_by provided, ensure it matches the active issue member
            - If no active issue exists raise ValueError (R2.01)
        Returns:
            the created RETURN BookTransaction object
        """
        if actor is None:
            raise ValueError("Actor (user performing the return) must be provided.")

        with transaction.atomic():
            # lock the relevant issue transaction rows
            active_txn = (
                BookTransaction.objects.select_for_update()
                .filter(book=self, txn_type=BookTransaction.TYPE_ISSUE, is_active=True)
                .first()
            )
            if not active_txn:
                raise ValueError("No active issue exists for this book.")

            # actor is a normal member returning themselves
            if not getattr(actor, "is_staff", False):
                if active_txn.member != actor:
                    raise ValueError("Return must be performed by the member who issued the book.")
            else:
                # Actor is staff/admin: optional returned_by param may be provided (id or User)
                if returned_by is not None:
                    # normalize returned_by to a user id
                    rid = returned_by.id if hasattr(returned_by, "id") else returned_by
                    if str(active_txn.member.id) != str(rid):
                        raise ValueError("The provided returned_by does not match the member who has the active issue.")

            # Set return date and mark issue txn inactive
            now = timezone.now()
            active_txn.return_date = now
            active_txn.is_active = False

            # Fine calculation using configurable rate/grace (R2.04)
            grace = int(getattr(settings, "LIBRARY_FINE_GRACE_DAYS", 0))
            per_day = Decimal(str(getattr(settings, "LIBRARY_FINE_PER_DAY", 1)))  # default 1 per day

            fine = Decimal("0.00")
            if active_txn.due_date:
                try:
                    overdue_days = (now.date() - active_txn.due_date.date()).days
                    if overdue_days > grace:
                        fine = (Decimal(overdue_days - grace) * per_day).quantize(Decimal("0.01"))
                except Exception:
                    # fallback: if dates weird, leave fine 0
                    fine = Decimal("0.00")

            # set fine and persist the issue transaction update
            active_txn.fine_amount = fine
            active_txn.save(update_fields=["return_date", "is_active", "fine_amount", "updated_at"])

            # Create a return transaction (non-active)
            ret_txn = BookTransaction.objects.create(
                book=self,
                member=active_txn.member,
                actor=actor or active_txn.member,
                txn_type=BookTransaction.TYPE_RETURN,
                return_date=now,
                fine_amount=fine,
                is_active=False,
                remarks=remarks,
            )

            # Update book state back to AVAILABLE (unless we plan to mark DAMAGED/LOST separately)
            self.status = Book.STATUS_AVAILABLE
            self.issued_to = None
            self.last_modified_by = actor
            self.save(update_fields=["status", "issued_to", "last_modified_by", "updated_at"])

            return ret_txn

    def mark_status(self, status_key, actor=None, remarks=""):
        """
        Implements R4.01-R4.04.
        Create a non-active transaction and update status.
        """
        status_map = {
            "LOST": self.STATUS_LOST,
            "DAMAGED": self.STATUS_DAMAGED,
            "MAINTENANCE": self.STATUS_MAINTENANCE,
            "REMOVED": self.STATUS_REMOVED,
        }
        if status_key not in status_map:
            raise ValueError("Invalid status change.")

        new_status = status_map[status_key]

        if self.status == self.STATUS_REMOVED:
            raise ValueError("Removed books cannot be reactivated or status-changed.")
        active_issue = BookTransaction.objects.filter(
            book=self,
            txn_type=BookTransaction.TYPE_ISSUE,
            is_active=True,
        ).first()
        if active_issue:
            raise ValueError("Return the active issue before marking the book as lost/damaged/removed.")

        with transaction.atomic():
            self.status = new_status
            self.last_modified_by = actor
            self.save(update_fields=["status", "last_modified_by", "updated_at"])

            txn = BookTransaction.objects.create(
                book=self,
                member=self.issued_to,
                actor=actor,
                txn_type=status_key,
                is_active=False,
                remarks=remarks,
            )

            return txn


# ----------------------------------------------------------------------
# BookTransaction model
# ----------------------------------------------------------------------
class BookTransaction(models.Model):
    TYPE_ISSUE = "ISSUE"
    TYPE_RETURN = "RETURN"
    TYPE_LOST = "LOST"
    TYPE_DAMAGED = "DAMAGED"
    TYPE_MAINTENANCE = "MAINTENANCE"
    TYPE_REMOVED = "REMOVED"

    TYPE_CHOICES = (
        (TYPE_ISSUE, "Issue"),
        (TYPE_RETURN, "Return"),
        (TYPE_LOST, "Lost"),
        (TYPE_DAMAGED, "Damaged"),
        (TYPE_MAINTENANCE, "Maintenance"),
        (TYPE_REMOVED, "Removed"),
    )

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="transactions")
    member = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                               on_delete=models.SET_NULL, related_name="book_transactions")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                              on_delete=models.SET_NULL, related_name="acted_transactions")

    txn_type = models.CharField(max_length=32, choices=TYPE_CHOICES,db_index=True)
    issue_date = models.DateTimeField(null=True, blank=True,db_index=True)
    due_date = models.DateTimeField(null=True, blank=True,db_index=True)
    return_date = models.DateTimeField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2,
                                      default=Decimal("0.00"),
                                      validators=[MinValueValidator(Decimal("0.00"))])
    remarks = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=False,db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

        # 🧠 Performance Indexes for frequent filters & joins
        indexes = [
            models.Index(fields=["book", "txn_type", "is_active"], name="txn_book_type_active_idx"),
            models.Index(fields=["due_date"], name="txn_due_date_idx"),
            models.Index(fields=["member", "txn_type"], name="txn_member_txn_idx"),
            models.Index(fields=["created_at"], name="txn_created_at_idx"),
        ]

        # PostgreSQL partial unique constraint for one active issue per book
        constraints = [
            models.UniqueConstraint(
                fields=["book"],
                condition=models.Q(txn_type="ISSUE", is_active=True),
                name="uq_book_active_issue",
            )
        ]

    def __str__(self):
        return f"{self.txn_type} - {self.book.title if self.book else 'n/a'}"

    def save(self, *args, **kwargs):
        # Prevent changing fine_amount once it was set (immutable once created with value)
        if self.pk:
            orig = BookTransaction.objects.filter(pk=self.pk).first()
            if orig and orig.fine_amount is not None and self.fine_amount != orig.fine_amount:
                # Allow the initial fine update that happens during return processing
                if not (
                    orig.fine_amount == Decimal("0.00")
                    and orig.return_date is None
                ):
                    raise ValueError("Fine amount is immutable once set.")
        super().save(*args, **kwargs)
