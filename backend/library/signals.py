# library/signals.py
import os
from django.db import connection
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.core.files.storage import default_storage

from .models import Book, BookCopy
from .models import AuditLog
from django.db.models.signals import post_save, post_delete


# ======================================================================
# 🧹 FILE CLEANUP SIGNALS
# ======================================================================
@receiver(post_delete, sender=Book)
def delete_book_cover(sender, instance, **kwargs):
    """Delete book cover image when a Book is deleted."""
    if instance.cover_image and getattr(instance.cover_image, "name", None):
        try:
            path = instance.cover_image.name
            if default_storage.exists(path):
                default_storage.delete(path)
                print(f"[SIGNAL] Deleted cover for {instance.book_code}")
        except Exception:
            pass


# ======================================================================
# 🔁 BOOK ID SEQUENCE RESET (SQLite/PostgreSQL)
# ======================================================================
@receiver(post_delete, sender=Book)
def reset_book_id_sequence(sender, instance, **kwargs):
    """Reset auto-increment sequence when table is empty (for SQLite/PostgreSQL)."""
    try:
        if Book.objects.count() == 0:
            vendor = connection.vendor
            with connection.cursor() as cursor:
                if vendor == "sqlite":
                    cursor.execute("DELETE FROM sqlite_sequence WHERE name=%s;", [Book._meta.db_table])
                elif vendor == "postgresql":
                    seq_name = f"{Book._meta.db_table}_id_seq"
                    cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;")
            print("[SIGNAL] ✅ Reset book ID sequence")
    except Exception:
        pass


# ======================================================================
# 🔄 QUANTITY SYNCHRONIZATION SIGNALS
# ======================================================================
@receiver(post_save, sender=BookCopy)
def sync_quantity_on_save(sender, instance, created, **kwargs):
    """Ensure Book.quantity matches total copies after a copy is created or updated."""
    try:
        book = instance.book
        new_count = book.copies.count()
        if book.quantity != new_count:
            book.quantity = new_count
            book.save(update_fields=["quantity"])
            print(f"[SIGNAL] 📘 Updated quantity for {book.book_code}: {new_count}")
    except Exception as e:
        print(f"[SIGNAL] ⚠️ Quantity sync failed on save for {instance.copy_code}: {e}")


@receiver(post_delete, sender=BookCopy)
def sync_quantity_on_delete(sender, instance, **kwargs):
    """Ensure Book.quantity updates correctly when a copy is deleted."""
    try:
        book = instance.book
        remaining = book.copies.count()
        if book.quantity != remaining:
            book.quantity = remaining
            book.save(update_fields=["quantity"])
            print(f"[SIGNAL] 🧾 Updated quantity for {book.book_code}: {remaining}")
    except Exception as e:
        print(f"[SIGNAL] ⚠️ Quantity sync failed on delete for {instance.copy_code}: {e}")


# ======================================================================
# 🆔 AUTO-GENERATE COPY CODE ON MANUAL CREATION
# ======================================================================
@receiver(post_save, sender=BookCopy)
def ensure_copy_code_exists(sender, instance, created, **kwargs):
    """
    Ensure a BookCopy created manually (e.g., from Admin) always gets a valid copy_code.
    """
    if not created:
        return

    try:
        if not instance.copy_code or instance.copy_code.strip() == "":
            book = instance.book
            # Determine next available sequence for this book
            last_copy = (
                BookCopy.objects.filter(book=book)
                .exclude(pk=instance.pk)
                .order_by("-id")
                .first()
            )
            next_index = 1
            if last_copy and last_copy.copy_code:
                try:
                    parts = last_copy.copy_code.split("-")
                    if parts[-1].isdigit():
                        next_index = int(parts[-1]) + 1
                except Exception:
                    pass
            # Format copy code as BOOKCODE-XX (two digits)
            new_code = f"{book.book_code}-{next_index:02d}"
            instance.copy_code = new_code
            instance.save(update_fields=["copy_code"])
            print(f"[SIGNAL] 🆕 Auto-generated copy code: {new_code}")
    except Exception as e:
        print(f"[SIGNAL] ⚠️ Failed to generate copy code for BookCopy ID {instance.id}: {e}")


# ======================================================================
# 📜 AUDIT LOG SIGNALS (STABLE)
# ======================================================================

# def _get_target_id(instance):
#     """Return human-readable ID for audit logs."""
#     return getattr(instance, "book_code", None) or getattr(instance, "copy_code", None) or str(instance.pk)


# @receiver(post_save)
# def audit_log_save(sender, instance, created, **kwargs):
#     """Only log CREATE events (skip updates and internal operations)."""
#     if sender not in (Book, BookCopy):
#         return

#     # Skip flagged saves
#     if getattr(instance, "_skip_audit", False):
#         return

#     # Only log explicit CREATE events
#     if created:
#         AuditLog.objects.create(
#             actor=None,
#             action=f"{sender.__name__.upper()}_CREATE",
#             target_type=sender.__name__,
#             target_id=_get_target_id(instance),
#             source="signal",
#             payload={},
#         )


# @receiver(post_delete)
# def audit_log_delete(sender, instance, **kwargs):
#     """Log deletes only if user-triggered (with _actor flag)."""
#     if sender not in (Book, BookCopy):
#         return

#     user = getattr(instance, "_actor", None)
#     if not user:
#         # skip cascade deletions and system deletes
#         return

#     AuditLog.objects.create(
#         actor=user if not getattr(user, "is_anonymous", True) else None,
#         action=f"{sender.__name__.upper()}_DELETE",
#         target_type=sender.__name__,
#         target_id=_get_target_id(instance),
#         source="admin-ui",
#         payload={},
#     )
