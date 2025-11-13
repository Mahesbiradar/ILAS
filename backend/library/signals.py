# library/signals.py
"""
ILAS v5 – Thread-Safe, Audit-Safe Signals
-----------------------------------------
✅ Cleans up deleted book cover images
✅ Prevents deletion of issued books (R6.01)
✅ Logs Book and BookTransaction events (R7.01–R7.03)
✅ Thread-local reentrant lock for non-recursive audit safety
"""

import logging
import threading
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from django.core.files.storage import default_storage

from .models import Book, BookTransaction, AuditLog, create_audit

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# Thread-local audit lock (reentrant-safe)
# ----------------------------------------------------------------------
_thread_state = threading.local()

def _get_audit_depth() -> int:
    return getattr(_thread_state, "audit_depth", 0)

def _set_audit_depth(value: int):
    _thread_state.audit_depth = value

def _audit_locked() -> bool:
    return _get_audit_depth() > 0

# Context helper
class audit_lock:
    def __enter__(self):
        _set_audit_depth(_get_audit_depth() + 1)
    def __exit__(self, exc_type, exc_val, exc_tb):
        _set_audit_depth(max(0, _get_audit_depth() - 1))


# ----------------------------------------------------------------------
# File cleanup
# ----------------------------------------------------------------------
@receiver(post_delete, sender=Book)
def cleanup_cover_image(sender, instance, **kwargs):
    """Delete stored cover image when a book is removed."""
    try:
        cover = getattr(instance, "cover_image", None)
        path = getattr(cover, "name", "") or ""
        if path.strip() and default_storage.exists(path):
            default_storage.delete(path)
            logger.info("🧹 Deleted cover image for %s", instance.book_code)
    except Exception as e:
        logger.warning("Cover cleanup failed for %s: %s", getattr(instance, "book_code", None), e)


# ----------------------------------------------------------------------
# Prevent deletion of issued books
# ----------------------------------------------------------------------
@receiver(pre_delete, sender=Book)
def prevent_delete_if_active(sender, instance, **kwargs):
    """R6.01 – Prevent deleting book with active issue transaction."""
    try:
        has_active = BookTransaction.objects.filter(
            book=instance,
            txn_type=BookTransaction.TYPE_ISSUE,
            is_active=True,
        ).exists()
        if has_active:
            logger.warning("🚫 Prevented deletion of book %s: active issue exists", instance.book_code)
            raise ValidationError("Cannot delete book with active issue transaction.")
    except ValidationError:
        raise  # re-raise so admin catches it
    except Exception as e:
        logger.exception("Error validating delete for %s: %s", instance.book_code, e)
        raise ValidationError("Unable to delete book due to transaction integrity error.")


# ----------------------------------------------------------------------
# Log BookTransaction create (Issue / Return / Status)
# ----------------------------------------------------------------------
@receiver(post_save, sender=BookTransaction)
def log_transaction_activity(sender, instance, created, **kwargs):
    """Create AuditLog for BookTransaction (R7.01–R7.03)."""
    if not created:
        return
    try:
        actor = instance.actor or instance.member
        if not actor:
            return  # skip system-initiated txns

        action_map = {
            BookTransaction.TYPE_ISSUE: AuditLog.ACTION_BOOK_ISSUE,
            BookTransaction.TYPE_RETURN: AuditLog.ACTION_BOOK_RETURN,
        }
        action = action_map.get(instance.txn_type, AuditLog.ACTION_STATUS_CHANGE)

        new_values = {
            "book_id": instance.book_id,
            "book_code": getattr(instance.book, "book_code", None),
            "txn_type": instance.txn_type,
            "member": getattr(instance.member, "username", None),
            "status": getattr(instance.book, "status", None),
            "fine": str(instance.fine_amount) if instance.fine_amount else None,
            "due_date": instance.due_date.isoformat() if instance.due_date else None,
            "return_date": instance.return_date.isoformat() if instance.return_date else None,
            "transaction_id": instance.id,
        }

        create_audit(
            actor=actor,
            action=action,
            target_type="BookTransaction",
            target_id=str(instance.id),
            new_values=new_values,
            remarks=f"{instance.txn_type} transaction recorded for book {instance.book.book_code}",
            source="transaction-system",
        )
    except Exception as e:
        logger.exception("Audit log failed for BookTransaction %s: %s", instance.id, e)


# ----------------------------------------------------------------------
# Log Book create/edit (with thread-safe guard)
# ----------------------------------------------------------------------
@receiver(post_save, sender=Book)
def log_book_activity(sender, instance, created, **kwargs):
    """Create AuditLog when a Book is added or edited."""
    if getattr(instance, "_suppress_audit", False):
        return
    if _audit_locked():
        return

    actor = getattr(instance, "last_modified_by", None)
    if not actor:
        return

    try:
        with audit_lock():
            action = AuditLog.ACTION_BOOK_ADD if created else AuditLog.ACTION_BOOK_EDIT
            remarks = "Book created" if created else "Book updated"

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
        logger.exception("Book audit creation failed for %s: %s", instance.book_code, e)


# ----------------------------------------------------------------------
# Log Book deletion
# ----------------------------------------------------------------------
@receiver(post_delete, sender=Book)
def log_book_delete(sender, instance, **kwargs):
    """Record audit entry when a Book is deleted."""
    actor = getattr(instance, "last_modified_by", None)
    if not actor:
        return
    try:
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
        logger.exception("Book deletion audit failed for %s: %s", instance.book_code, e)
