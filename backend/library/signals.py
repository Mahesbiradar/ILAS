"""
ILAS v3 – Stable Signal Handlers (Non-Recursive, Audit-Safe)
------------------------------------------------------------
- Cleans up cover images
- Resets ID sequence (dev only)
- Creates AuditLog entries for Book and BookTransaction events
- Uses a global re-entrancy guard to prevent recursive post_save loops
- Skips audit when instance._suppress_audit is True
"""

import logging
from django.db import connection
from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from django.core.files.storage import default_storage

from .models import Book, BookTransaction, AuditLog, create_audit

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# Global audit re-entrancy guard
# ----------------------------------------------------------------------
_AUDIT_LOCK = False


# ----------------------------------------------------------------------
# Clean up cover image file when a Book is deleted
# ----------------------------------------------------------------------
@receiver(post_delete, sender=Book)
def cleanup_cover_image(sender, instance, **kwargs):
    """Delete cover image when a Book is deleted."""
    try:
        cover = getattr(instance, "cover_image", None)
        if cover and getattr(cover, "name", None):
            path = cover.name
            if default_storage.exists(path):
                default_storage.delete(path)
    except Exception as e:
        logger.warning("Cover cleanup failed for Book %s: %s", getattr(instance, "book_code", None), e)


# ----------------------------------------------------------------------
# Reset Book ID sequence (dev convenience)
# ----------------------------------------------------------------------
@receiver(post_delete, sender=Book)
def reset_book_id_sequence(sender, instance, **kwargs):
    """If all books deleted, reset the auto-increment sequence."""
    try:
        if Book.objects.exists():
            return
        table = Book._meta.db_table
        vendor = connection.vendor
        with connection.cursor() as cursor:
            if vendor == "sqlite":
                cursor.execute("DELETE FROM sqlite_sequence WHERE name=%s;", [table])
            elif vendor == "postgresql":
                seq = f"{table}_id_seq"
                cursor.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1;")
    except Exception as e:
        logger.debug("Book ID sequence reset skipped: %s", e)


# ----------------------------------------------------------------------
# Prevent deleting a Book with active issue
# ----------------------------------------------------------------------
@receiver(pre_delete, sender=Book)
def prevent_delete_if_active(sender, instance, **kwargs):
    try:
        if BookTransaction.objects.filter(
            book=instance, txn_type=BookTransaction.TYPE_ISSUE, is_active=True
        ).exists():
            raise Exception("Cannot delete book with active issue transaction.")
    except Exception as e:
        logger.exception("Prevented deletion of book %s: %s",
                         getattr(instance, "book_code", instance.pk), e)
        raise


# ----------------------------------------------------------------------
# Log BookTransaction create events
# ----------------------------------------------------------------------
@receiver(post_save, sender=BookTransaction)
def log_transaction_activity(sender, instance, created, **kwargs):
    """Create an audit record for new BookTransaction rows."""
    try:
        if not created:
            return

        actor = instance.actor or instance.member
        if not actor:
            return

        # Map txn types to audit actions
        action_map = {
            "ISSUE": AuditLog.ACTION_BOOK_ISSUE,
            "RETURN": AuditLog.ACTION_BOOK_RETURN,
        }
        action = action_map.get(instance.txn_type, AuditLog.ACTION_STATUS_CHANGE)

        new_values = {
            "book_code": getattr(instance.book, "book_code", None),
            "txn_type": instance.txn_type,
            "member": getattr(instance.member, "username", None),
            "fine": str(instance.fine_amount) if instance.fine_amount else None,
            "due_date": instance.due_date.isoformat() if instance.due_date else None,
            "return_date": instance.return_date.isoformat() if instance.return_date else None,
        }

        create_audit(
            actor=actor,
            action=action,
            target_type="BookTransaction",
            target_id=str(instance.id),
            new_values=new_values,
            remarks=f"{instance.txn_type} transaction recorded",
            source="transaction-system",
        )
    except Exception as e:
        logger.exception("Audit creation failed for BookTransaction %s: %s",
                         getattr(instance, "id", None), e)


# ----------------------------------------------------------------------
# Log Book create/edit events (admin + API)
# ----------------------------------------------------------------------
@receiver(post_save, sender=Book)
def log_book_activity(sender, instance, created, **kwargs):
    """
    Log Book create/edit to AuditLog.
    - Prevents recursive calls using _AUDIT_LOCK.
    - Skips when instance._suppress_audit is True (bulk upload/admin internal).
    """
    global _AUDIT_LOCK
    try:
        if _AUDIT_LOCK:
            return

        if getattr(instance, "_suppress_audit", False):
            return

        actor = getattr(instance, "last_modified_by", None)
        if not actor:
            return  # system update, skip

        _AUDIT_LOCK = True

        action = AuditLog.ACTION_BOOK_ADD if created else AuditLog.ACTION_BOOK_EDIT
        remarks = "Book added" if created else "Book updated"

        create_audit(
            actor=actor,
            action=action,
            target_type="Book",
            target_id=instance.book_code or str(instance.pk),
            new_values={
                "title": instance.title,
                "isbn": instance.isbn,
                "status": instance.status,
            },
            remarks=remarks,
            source="admin-ui",
        )
    except Exception as e:
        logger.exception("log_book_activity failed for Book %s: %s",
                         getattr(instance, "book_code", None), e)
    finally:
        _AUDIT_LOCK = False


# ----------------------------------------------------------------------
# Log Book deletion
# ----------------------------------------------------------------------
@receiver(post_delete, sender=Book)
def log_book_delete(sender, instance, **kwargs):
    """Log Book deletions to AuditLog."""
    try:
        actor = getattr(instance, "last_modified_by", None)
        if not actor:
            return
        create_audit(
            actor=actor,
            action=AuditLog.ACTION_BOOK_DELETE,
            target_type="Book",
            target_id=instance.book_code or str(instance.pk),
            old_values={"title": instance.title, "isbn": instance.isbn},
            remarks="Book deleted",
            source="admin-ui",
        )
    except Exception as e:
        logger.exception("log_book_delete failed for Book %s: %s",
                         getattr(instance, "book_code", None), e)
