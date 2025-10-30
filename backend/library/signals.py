# library/signals.py
from django.db.models.signals import post_delete
from django.dispatch import receiver
import os
from .models import Book, BookCopy
from django.db import connection

@receiver(post_delete, sender=BookCopy)
def delete_barcode_image(sender, instance, **kwargs):
    if instance.barcode_image and hasattr(instance.barcode_image, "path") and os.path.isfile(instance.barcode_image.path):
        try:
            os.remove(instance.barcode_image.path)
        except Exception:
            pass

@receiver(post_delete, sender=Book)
def delete_book_cover(sender, instance, **kwargs):
    if instance.cover_image and hasattr(instance.cover_image, "path") and os.path.isfile(instance.cover_image.path):
        try:
            os.remove(instance.cover_image.path)
        except Exception:
            pass

@receiver(post_delete, sender=Book)
def reset_book_id_sequence(sender, instance, **kwargs):
    """Reset sequence depending on DB vendor when table becomes empty."""
    try:
        if Book.objects.count() == 0:
            vendor = connection.vendor
            with connection.cursor() as cursor:
                if vendor == "sqlite":
                    cursor.execute("DELETE FROM sqlite_sequence WHERE name=%s;", [Book._meta.db_table])
                elif vendor == "postgresql":
                    seq_name = f"{Book._meta.db_table}_id_seq"
                    cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;")
    except Exception:
        pass
