# library/models.py
import os
import uuid
from typing import List, Optional

from django.core.files.storage import default_storage
from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

UserModel = get_user_model()


# ----------------------------------------------------------------------
# BOOK MODEL
# ----------------------------------------------------------------------
class Book(models.Model):
    """Main catalog book (metadata). Physical copies handled separately."""
    id = models.AutoField(primary_key=True)
    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    book_code = models.CharField(max_length=20, unique=True, editable=False)

    # Bibliographic details
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True, null=True)
    author = models.CharField(max_length=200, blank=True, null=True)
    publisher = models.CharField(max_length=200, blank=True, null=True)
    edition = models.CharField(max_length=100, blank=True, null=True)
    publication_year = models.PositiveIntegerField(blank=True, null=True)
    isbn = models.CharField(max_length=64, blank=True, null=True)
    category = models.CharField(max_length=120, blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True, default="English")
    keywords = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # Inventory info
    quantity = models.PositiveIntegerField(default=0)
    shelf_location = models.CharField(max_length=200, blank=True, null=True)
    condition = models.CharField(max_length=64, default="Good")
    availability_status = models.CharField(max_length=50, default="Available")

    # Financial / admin
    book_cost = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    vendor_name = models.CharField(max_length=100, blank=True, null=True)
    source = models.CharField(max_length=100, blank=True, null=True)
    accession_number = models.CharField(max_length=50, blank=True, null=True)
    cover_image = models.ImageField(upload_to="book_covers/", blank=True, null=True)

    # Digital
    storage_type = models.CharField(max_length=50, blank=True, null=True)
    file_url = models.URLField(blank=True, null=True)
    digital_identifier = models.CharField(max_length=100, blank=True, null=True)
    format = models.CharField(max_length=50, blank=True, null=True)

    # Cataloging
    library_section = models.CharField(max_length=100, blank=True, null=True)
    dewey_decimal = models.CharField(max_length=50, blank=True, null=True)
    cataloger = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    # Metadata
    added_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-added_date"]
        indexes = [
            models.Index(fields=["isbn"]),
            models.Index(fields=["title"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.book_code} - {self.title}"

    def save(self, *args, **kwargs):
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating and not self.book_code:
            self.book_code = f"ILAS-ET-{self.id:04d}"
            super().save(update_fields=["book_code"])
            # fallback: create copies if not exists
            if not BookCopy.objects.filter(book=self).exists() and self.quantity > 0:
                self.create_copies(self.quantity)

    def soft_delete(self):
        self.is_active = False
        self.save(update_fields=["is_active"])

    # --- Copy helpers ---
    def get_next_copy_suffix(self) -> int:
        last = BookCopy.objects.filter(book=self).order_by("-created_at").first()
        if not last:
            return 1
        try:
            part = last.copy_code.rsplit("-", 1)[-1]
            return int(part) + 1
        except Exception:
            return BookCopy.objects.filter(book=self).count() + 1

    def build_copy_instances(self, copies: int = 1, start_index: Optional[int] = None) -> List["BookCopy"]:
        if start_index is None:
            start_index = self.get_next_copy_suffix()
        instances = []
        for i in range(copies):
            suffix = f"{start_index + i:02d}"
            copy_code = f"{self.book_code}-{suffix}"
            instances.append(BookCopy(book=self, copy_code=copy_code))
        return instances

    def create_copies(self, copies: int = 1) -> List["BookCopy"]:
        """
        Create physical BookCopy instances for this Book.
        Each copy:
        - Inherits the book's shelf_location
        - Defaults to condition='Good'
        - Is created atomically and efficiently in bulk
        Ensures that quantity matches exact number of physical copies.
        """
        if copies < 1:
            return []

        with transaction.atomic():
            # Build and create BookCopy records
            objs = self.build_copy_instances(copies)
            for obj in objs:
                obj.shelf_location = self.shelf_location or ""
                obj.condition = obj.condition or "Good"

            BookCopy.objects.bulk_create(objs)

            # Set quantity to the exact total number of BookCopy objects
            total_copies = BookCopy.objects.filter(book=self).count()
            self._skip_audit = True
            self.quantity = total_copies
            self.save(update_fields=["quantity"])

            # Return the newly created BookCopy instances (in correct order)
            return list(
                BookCopy.objects.filter(book=self)
                .order_by("-created_at")[:copies][::-1]
            )


    def delete_with_assets(self):
        """Delete a book and its assets (cover + copies)."""
        with transaction.atomic():
            BookCopy.objects.filter(book=self).delete()
            if self.cover_image and getattr(self.cover_image, "name", None):
                try:
                    path = self.cover_image.name
                    if default_storage.exists(path):
                        default_storage.delete(path)
                except Exception:
                    pass
            self.delete()

    @property
    def copies_count(self):
        return BookCopy.objects.filter(book=self).count()


# ----------------------------------------------------------------------
# BOOK COPY MODEL
# ----------------------------------------------------------------------
class BookCopy(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("issued", "Issued"),
        ("lost", "Lost"),
        ("reserved", "Reserved"),
        ("maintenance", "Maintenance"),
    ]

    id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="copies")
    copy_code = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    shelf_location = models.CharField(max_length=128, blank=True)
    condition = models.CharField(max_length=128, blank=True, default="Good")
    purchase_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["book", "copy_code"]

    def __str__(self):
        return f"{self.copy_code} ({self.book.book_code})"

    def save(self, *args, **kwargs):
        if not hasattr(self.book, "_skip_audit"):
            self.book._skip_audit = True
        super().save(*args, **kwargs)
        # Auto-update book info (quantity, shelves)
        try:
            total = BookCopy.objects.filter(book=self.book).count()
            shelves = BookCopy.objects.filter(book=self.book).values_list("shelf_location", flat=True)
            unique = sorted({s for s in shelves if s})
            self.book.quantity = total
            self.book.shelf_location = ", ".join(unique) if unique else None
            setattr(self.book, "_skip_audit", True)
            self.book.save(update_fields=["quantity", "shelf_location"])
            setattr(self.book, "_skip_audit", False)
        except Exception as e:
            print("BookCopy sync failed:", e)

    def delete_with_assets(self):
        """Delete a BookCopy and keep Book quantity in sync."""
        self.delete()


# ----------------------------------------------------------------------
# AUDIT LOGS
# ----------------------------------------------------------------------
class AuditLog(models.Model):
    actor = models.ForeignKey(
        UserModel, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100, null=True, blank=True)
    source = models.CharField(max_length=50, default="system")  # NEW FIELD
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        actor = self.actor.username if self.actor else "System"
        return f"[{self.action}] {self.target_type} ({self.target_id}) by {actor}"



# ----------------------------------------------------------------------
# TRANSACTION ARCHIVE
# ----------------------------------------------------------------------
class TransactionArchive(models.Model):
    user = models.ForeignKey(UserModel, on_delete=models.SET_NULL, null=True)
    book_title = models.CharField(max_length=200)
    type = models.CharField(max_length=20)
    archived_at = models.DateTimeField(default=timezone.now)
    original_id = models.PositiveIntegerField()

    class Meta:
        ordering = ["-archived_at"]

    def __str__(self):
        return f"Archived {self.book_title} ({self.type})"
