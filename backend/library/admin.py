# library/admin.py
import os
import zipfile
import openpyxl
from django.contrib import admin, messages
from django.shortcuts import render, redirect
from django.urls import path
from django.core.files.base import ContentFile

from .models import Book, BookCopy, AuditLog, TransactionArchive
from .serializers import BookSerializer, BulkBookImportSerializer
from .views import create_audit


# ----------------------------------------------------------------------
# INLINE: BookCopy Inline (shown under each Book in admin)
# ----------------------------------------------------------------------
class BookCopyInline(admin.TabularInline):
    model = BookCopy
    extra = 0
    readonly_fields = ("copy_code", "created_at", "updated_at")
    fields = ("copy_code", "status", "shelf_location", "condition")
    ordering = ("copy_code",)
    can_delete = True


# ----------------------------------------------------------------------
# BOOK ADMIN
# ----------------------------------------------------------------------
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "book_code", "title", "author", "isbn", "category",
        "quantity", "copies_count", "shelf_location",
        "is_active", "added_date",
    )
    list_filter = ("category", "language", "is_active")
    search_fields = ("title", "author", "isbn", "book_code", "category")
    ordering = ("-added_date",)
    inlines = [BookCopyInline]
    readonly_fields = ("book_code", "copies_count", "added_date", "updated_at")
    change_list_template = "admin/library/book_change_list.html"

    fieldsets = (
        ("Basic Info", {
            "fields": (
                "book_code", "title", "subtitle", "author", "publisher",
                "edition", "publication_year", "isbn", "category", "language",
                "description", "cover_image",
            )
        }),
        ("Inventory & Status", {
            "fields": (
                "quantity", "shelf_location", "condition", "availability_status",
                "is_active", "copies_count",
            )
        }),
        ("Additional Metadata", {
            "fields": (
                "book_cost", "vendor_name", "source", "accession_number",
                "library_section", "cataloger", "remarks",
                "added_date", "updated_at",
            )
        }),
    )

    # -------------------- Audit Hooks --------------------
    def save_model(self, request, obj, form, change):
        """Create or update a Book with single audit entry."""
        # avoid logging internal sync saves
        if getattr(obj, "_skip_audit", False):
            super().save_model(request, obj, form, change)
            return
        super().save_model(request, obj, form, change)
        action = "BOOK_EDIT" if change else "BOOK_CREATE"
        create_audit(
            request.user, action, "Book", obj.book_code,
            {"title": obj.title}, source="admin-ui"
        )

    def delete_model(self, request, obj):
        """Delete a Book with audit log."""
        title, code = obj.title, obj.book_code
        super().delete_model(request, obj)
        create_audit(
            request.user, "BOOK_DELETE", "Book", code,
            {"title": title}, source="admin-ui"
        )

    def delete_queryset(self, request, queryset):
        """When admin deletes multiple Books."""
        for obj in queryset:
            title, code = obj.title, obj.book_code
            try:
                if obj.cover_image and getattr(obj.cover_image, "name", None):
                    obj.cover_image.delete(save=False)
            except Exception:
                pass
            obj.delete_with_assets()
            create_audit(
                request.user, "BOOK_DELETE", "Book", code,
                {"title": title}, source="admin-ui"
            )

    # -------------------- Bulk Upload View --------------------
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("bulk-upload/", self.admin_site.admin_view(self.bulk_upload_view),
                 name="library-book-bulk-upload"),
        ]
        return custom_urls + urls

    def bulk_upload_view(self, request):
        """Handle bulk book uploads via Excel + ZIP."""
        if request.method == "POST":
            excel_file = request.FILES.get("file")
            images_zip = request.FILES.get("images")

            if not excel_file:
                messages.error(request, "Excel file is required.")
                return redirect("..")

            created = []
            errors = []
            images_map = {}

            # Load ZIP images if provided
            if images_zip:
                try:
                    with zipfile.ZipFile(images_zip) as z:
                        for name in z.namelist():
                            base = os.path.basename(name)
                            if not base:
                                continue
                            images_map[base.lower()] = z.read(name)
                    messages.info(request, f"Loaded {len(images_map)} images from ZIP.")
                except zipfile.BadZipFile:
                    messages.warning(request, "Invalid ZIP file uploaded.")

            try:
                wb = openpyxl.load_workbook(excel_file, data_only=True)
                ws = wb.active
                header = [str(c.value).strip().lower() if c.value else "" for c in ws[1]]

                synonym_map = {
                    "book title": "title", "bookname": "title",
                    "subtitle": "subtitle", "author": "author",
                    "publisher": "publisher", "edition": "edition",
                    "publication year": "publication_year", "isbn": "isbn",
                    "language": "language", "category": "category",
                    "keywords": "keywords", "description": "description",
                    "quantity": "quantity", "shelf location": "shelf_location",
                    "condition": "condition", "availability status": "availability_status",
                    "book cost": "book_cost", "vendor": "vendor_name",
                    "source": "source", "accession_start_no": "accession_number",
                    "barcode_prefix": "barcode_prefix", "storage_type": "storage_type",
                    "file_url": "file_url", "digital_identifier": "digital_identifier",
                    "format": "format", "qr_code": "qr_code",
                    "library_section": "library_section", "dewey_decimal": "dewey_decimal",
                    "cataloger": "cataloger", "remarks": "remarks",
                }
                canonical_header = [synonym_map.get(h, h) for h in header]
                if "title" not in canonical_header:
                    messages.error(request, "Excel must include a 'title' column.")
                    return redirect("..")

                allowed_fields = {f.name for f in Book._meta.get_fields()}

                for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                    if not row or all(v in (None, "") for v in row):
                        continue
                    data = dict(zip(canonical_header, row))
                    try:
                        if "quantity" in data and data["quantity"] not in (None, ""):
                            data["quantity"] = int(float(data["quantity"]))
                    except Exception:
                        pass
                    try:
                        if "publication_year" in data and data["publication_year"] not in (None, ""):
                            data["publication_year"] = int(float(data["publication_year"]))
                    except Exception:
                        pass
                    if "book_cost" in data and data["book_cost"] not in (None, ""):
                        data["book_cost"] = str(data["book_cost"]).strip()

                    if not data.get("title"):
                        errors.append(f"Row {i}: Missing title")
                        continue

                    try:
                        serializer = BulkBookImportSerializer(data=data)
                        serializer.is_valid(raise_exception=True)
                        book_data = serializer.validated_data
                        qty = int(book_data.get("quantity") or 1)
                        if "quantity" in book_data:
                            book_data.pop("quantity")

                        filtered_data = {
                            k: v for k, v in book_data.items() if (k in allowed_fields and v is not None)
                        }
                        book = Book.objects.create(**filtered_data)

                        if images_map:
                            for key in [
                                f"{(book.isbn or '').strip().lower()}.jpg",
                                f"{(book.title or '').strip().lower()}.jpg",
                            ]:
                                if key in images_map:
                                    book.cover_image.save(f"{book.book_code}.jpg",
                                                          ContentFile(images_map[key]), save=True)
                                    break

                        if qty and qty > 0:
                            book.create_copies(qty)
                        book._skip_audit = True
                        book.save(update_fields=["quantity"])
                        created.append(book.book_code)
                        create_audit(request.user, "BOOK_CREATE", "Book",
                                     book.book_code, {"title": book.title}, source="admin-ui")
                    except Exception as e:
                        msg = getattr(e, "detail", str(e))
                        errors.append(f"Row {i}: {msg}")

                messages.success(request, f"✅ {len(created)} books uploaded successfully.")
                if errors:
                    messages.warning(request, f"⚠️ {len(errors)} rows failed. Example: {errors[:3]}")
                create_audit(request.user, "BULK_UPLOAD", "Book", "-",
                             {"created": len(created), "errors": len(errors)}, source="admin-ui")
            except Exception as e:
                messages.error(request, f"❌ Upload failed: {e}")

            return redirect("..")

        context = {"title": "Bulk Upload Books",
                   "template_download_url": "/media/templates/Book_Template.xlsx"}
        return render(request, "admin/library/book_bulk_upload.html", context)


# ----------------------------------------------------------------------
# BOOKCOPY ADMIN
# ----------------------------------------------------------------------
@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ("copy_code", "book", "status", "shelf_location", "condition", "created_at")
    list_filter = ("status", "condition")
    search_fields = ("copy_code", "book__title", "book__book_code", "shelf_location")
    readonly_fields = ("copy_code", "created_at", "updated_at")

    def save_model(self, request, obj, form, change):
        """Create or update a BookCopy with single audit entry."""
        if getattr(obj.book, "_skip_audit", False):
            super().save_model(request, obj, form, change)
            return
        super().save_model(request, obj, form, change)
        action = "BOOKCOPY_EDIT" if change else "BOOKCOPY_CREATE"
        create_audit(request.user, action, "BookCopy", obj.copy_code,
                     {"book": obj.book.book_code}, source="admin-ui")

    def delete_model(self, request, obj):
        """Delete a BookCopy with audit log."""
        code, book_code = obj.copy_code, obj.book.book_code
        super().delete_model(request, obj)
        create_audit(request.user, "BOOKCOPY_DELETE", "BookCopy", code,
                     {"book": book_code}, source="admin-ui")

    def delete_queryset(self, request, queryset):
        """When admin deletes multiple BookCopies."""
        for obj in queryset:
            code, book_code = obj.copy_code, obj.book.book_code
            obj.delete()
            create_audit(request.user, "BOOKCOPY_DELETE", "BookCopy", code,
                         {"book": book_code}, source="admin-ui")


# ----------------------------------------------------------------------
# AUDIT LOG ADMIN
# ----------------------------------------------------------------------
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("actor", "action", "target_type", "target_id", "source", "created_at")
    list_filter = ("action", "target_type", "source")
    search_fields = ("actor__username", "action", "target_type", "target_id")
    ordering = ("-created_at",)
    readonly_fields = ("actor", "action", "target_type", "target_id", "source", "payload", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ----------------------------------------------------------------------
# TRANSACTION ARCHIVE ADMIN
# ----------------------------------------------------------------------
@admin.register(TransactionArchive)
class TransactionArchiveAdmin(admin.ModelAdmin):
    list_display = ("book_title", "user", "type", "archived_at")
    search_fields = ("book_title", "user__username", "type")
    ordering = ("-archived_at",)
