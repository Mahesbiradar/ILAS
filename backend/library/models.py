# library/models.py
import os
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

# barcode / image libs (optional at runtime)
try:
    import barcode
    from barcode.writer import ImageWriter
    from PIL import Image, ImageDraw, ImageFont
except Exception:
    barcode = None
    Image = None

UserModel = get_user_model()


# ----------------------------------------------------------------------
# BARCODE GENERATION (Large readable centered text)
# ----------------------------------------------------------------------
def _generate_barcode_content_file(barcode_value: str, book_title: str = ""):
    """
    Print-ready barcode image:
      - Code128 barcode (no built-in text)
      - Two centered lines under barcode:
        * ID line (large)
        * Book title line (large)
      - High resolution (300 DPI)
    Returns django.core.files.base.ContentFile (PNG) or empty ContentFile on errors.
    """
    from django.core.files.base import ContentFile

    try:
        if not barcode or not Image:
            return ContentFile(b"")

        code128 = barcode.get("code128", barcode_value, writer=ImageWriter())
        fp = BytesIO()
        code128.write(fp, {
            "module_height": 20.0,
            "module_width": 0.45,
            "quiet_zone": 6.0,
            "font_size": 0,
            "write_text": False
        })
        fp.seek(0)

        img = Image.open(fp).convert("RGB")
        width, height = img.size

        # more vertical space to fit the two larger lines
        extra_space = 130
        new_img = Image.new("RGB", (width, height + extra_space), "white")
        new_img.paste(img, (0, 0))

        draw = ImageDraw.Draw(new_img)
        try:
            # large fonts (attempt truetype)
            font_id = ImageFont.truetype("arial.ttf", 52)
            font_title = ImageFont.truetype("arial.ttf", 46)
        except Exception:
            # fallback default (size may vary)
            font_id = ImageFont.load_default()
            font_title = ImageFont.load_default()

        # center ID
        id_text = barcode_value.strip()
        try:
            id_width = draw.textlength(id_text, font=font_id)
        except Exception:
            id_width = len(id_text) * 8
        id_x = max(0, (width - int(id_width)) // 2)
        id_y = height + 10
        draw.text((id_x, id_y), id_text, fill="black", font=font_id)

        # center Title on next line
        title_text = (book_title or "").strip()
        try:
            title_width = draw.textlength(title_text, font=font_title)
        except Exception:
            title_width = len(title_text) * 7
        title_x = max(0, (width - int(title_width)) // 2)
        title_y = id_y + 60
        draw.text((title_x, title_y), title_text, fill="black", font=font_title)

        fp_out = BytesIO()
        new_img.save(fp_out, format="PNG", dpi=(300, 300))
        fp_out.seek(0)
        return ContentFile(fp_out.read())

    except Exception as e:
        # do not crash, return empty content
        print("Barcode generation error:", e)
        return ContentFile(b"")


# ----------------------------------------------------------------------
# BOOK & COPY MODELS
# ----------------------------------------------------------------------
class Book(models.Model):
    id = models.AutoField(primary_key=True)
    book_code = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200, blank=True, null=True)
    isbn = models.CharField(max_length=64, blank=True, null=True)
    category = models.CharField(max_length=120, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    cover_image = models.ImageField(upload_to="book_covers/", blank=True, null=True)
    added_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # ✅ Soft delete flag

    class Meta:
        ordering = ["-added_date"]

    def soft_delete(self):
        """Soft delete: mark book inactive."""
        self.is_active = False
        self.save(update_fields=["is_active"])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.book_code:
            self.book_code = f"ILAS-ET-{self.id:04d}"
            super().save(update_fields=["book_code"])

        # create copies for new book by given quantity
        # if is_new:
        #     for _ in range(self.quantity):
        #         BookCopy.objects.create(book=self)

    def __str__(self):
        return f"{self.book_code} - {self.title}"


class BookCopy(models.Model):
    book = models.ForeignKey(Book, related_name="copies", on_delete=models.CASCADE)
    copy_id = models.CharField(max_length=30, unique=True, db_index=True)
    barcode_value = models.CharField(max_length=40, unique=True, db_index=True)
    barcode_image = models.ImageField(upload_to="barcodes/", blank=True, null=True)
    condition = models.CharField(max_length=64, default="Good")
    status = models.CharField(
        max_length=32,
        choices=[("available", "Available"), ("issued", "Issued"), ("lost", "Lost"), ("maintenance", "Maintenance")],
        default="available",
    )
    location = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["copy_id"]

    def save(self, *args, **kwargs):
        creating = self._state.adding
        if creating:
            # determine next sequential copy number for this book (3-digit)
            existing = BookCopy.objects.filter(book=self.book).values_list("copy_id", flat=True)
            max_num = 0
            for cid in existing:
                if "-C" in str(cid):
                    try:
                        num = int(cid.split("-C")[-1])
                        max_num = max(max_num, num)
                    except Exception:
                        pass
            next_num = max_num + 1
            formatted = f"{next_num:03d}"
            self.copy_id = f"{self.book.book_code}-C{formatted}"
            self.barcode_value = self.copy_id

        super().save(*args, **kwargs)

        # generate barcode image (PNG) after first save
        if creating and not self.barcode_image:
            try:
                content = _generate_barcode_content_file(self.barcode_value, self.book.title)
                if content and getattr(content, "size", None) is not None and content.size > 0:
                    filename = f"{self.copy_id}.png"

                    # Try to optimize PNG using Pillow if available (reduce size), fallback to raw content
                    try:
                        if Image is not None:
                            content.seek(0)
                            img = Image.open(BytesIO(content.read()))
                            out_buf = BytesIO()
                            img.save(out_buf, format="PNG", optimize=True)
                            out_buf.seek(0)
                            self.barcode_image.save(filename, ContentFile(out_buf.read()), save=True)
                        else:
                            content.seek(0)
                            self.barcode_image.save(filename, content, save=True)
                    except Exception as e:
                        # fallback raw
                        try:
                            content.seek(0)
                            self.barcode_image.save(filename, content, save=True)
                        except Exception as inner:
                            print("Failed to save barcode (fallback):", inner)
            except Exception as e:
                print("Barcode generation failed:", e)

    def __str__(self):
        return f"{self.copy_id} ({self.book.title})"


# ----------------------------------------------------------------------
# TRANSACTION & AUDIT LOG MODELS
# ----------------------------------------------------------------------
class Transaction(models.Model):
    TYPE_ISSUE = "ISSUE"
    TYPE_RETURN = "RETURN"
    TYPE_RENEW = "RENEW"
    TYPE_LOST = "LOST"
    TYPE_FINE = "FINE_ADJUST"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_COMPLETED = "COMPLETED"

    id = models.AutoField(primary_key=True)
    book_copy = models.ForeignKey(BookCopy, related_name="transactions", on_delete=models.PROTECT)
    user = models.ForeignKey(UserModel, related_name="transactions", on_delete=models.CASCADE)
    type = models.CharField(max_length=16)
    issued_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, default=STATUS_ACTIVE)
    fine_amount = models.DecimalField(max_digits=9, decimal_places=2, default=Decimal("0.00"))
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(UserModel, null=True, blank=True, related_name="created_transactions", on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def perform_return(self, actor=None, notes=None):
        # simple return implementation
        self.returned_at = timezone.now()
        self.status = Transaction.STATUS_COMPLETED
        if notes:
            self.notes = (self.notes or "") + f"\nRETURN: {notes}"
        # set book copy status to available
        bc = self.book_copy
        bc.status = "available"
        bc.save()
        self.save()

    def perform_renew(self, additional_days=7, actor=None, notes=None):
        if not self.due_at:
            self.due_at = timezone.now()
        self.due_at = self.due_at + timezone.timedelta(days=additional_days)
        if notes:
            self.notes = (self.notes or "") + f"\nRENEW: {notes}"
        self.save()

    def mark_lost(self, fine_amount=None, actor=None, notes=None):
        self.status = Transaction.STATUS_COMPLETED
        if isinstance(fine_amount, (int, float, Decimal, str)):
            try:
                self.fine_amount = Decimal(str(fine_amount))
            except Exception:
                pass
        bc = self.book_copy
        bc.status = "lost"
        bc.save()
        if notes:
            self.notes = (self.notes or "") + f"\nLOST: {notes}"
        self.save()

    def __str__(self):
        return f"Txn {self.id} - {self.book_copy.copy_id} - {self.type}"


class AuditLog(models.Model):
    actor = models.ForeignKey(UserModel, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=128)
    target_type = models.CharField(max_length=64, blank=True, null=True)
    target_id = models.CharField(max_length=128, blank=True, null=True)
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.created_at} - {self.actor} - {self.action}"


class TransactionArchive(models.Model):
    """Archived transactions older than 6 months."""
    user = models.ForeignKey(UserModel, on_delete=models.SET_NULL, null=True)
    book_title = models.CharField(max_length=200)
    type = models.CharField(max_length=20)
    archived_at = models.DateTimeField(default=timezone.now)
    original_id = models.PositiveIntegerField()

    def __str__(self):
        return f"Archived {self.book_title} ({self.type})"

    class Meta:
        ordering = ["-archived_at"]
