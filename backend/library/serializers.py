# library/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Book, BookCopy, AuditLog

User = get_user_model()


# ======================================================================
# BOOK COPY SERIALIZER
# ======================================================================
class BookCopySerializer(serializers.ModelSerializer):
    """Serializer for individual physical copies of a book."""

    book_title = serializers.ReadOnlyField(source="book.title")
    book_code = serializers.ReadOnlyField(source="book.book_code")

    class Meta:
        model = BookCopy
        fields = [
            "id", "book", "book_code", "book_title",
            "copy_code", "status", "shelf_location",
            "condition", "purchase_date",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "book_code", "book_title", "copy_code",
            "created_at", "updated_at",
        ]

    def validate_status(self, value):
        if value not in dict(BookCopy.STATUS_CHOICES):
            raise serializers.ValidationError("Invalid status.")
        return value

    def create(self, validated_data):
        """Create a new BookCopy with automatic copy_code."""
        book = validated_data.get("book")
        copies = book.create_copies(1)
        copy = copies[0]
        # update editable fields
        copy.status = validated_data.get("status", copy.status)
        copy.shelf_location = validated_data.get("shelf_location", copy.shelf_location)
        copy.condition = validated_data.get("condition", copy.condition)
        copy.purchase_date = validated_data.get("purchase_date", copy.purchase_date)
        copy.save()
        return copy


# ======================================================================
# BOOK SERIALIZER (Main Book metadata)
# ======================================================================
class BookSerializer(serializers.ModelSerializer):
    """Serializer for the Book model with copy-level integration."""

    copies_count = serializers.SerializerMethodField()
    copies = BookCopySerializer(many=True, read_only=True)

    def get_copies_count(self, obj):
        return obj.copies.count()

    class Meta:
        model = Book
        fields = [
            # identifiers
            "id", "uid", "book_code",

            # bibliographic
            "title", "subtitle", "author", "publisher", "edition",
            "publication_year", "isbn", "category", "language",
            "keywords", "description",

            # inventory / physical info
            "quantity", "shelf_location", "condition", "availability_status",

            # admin / finance
            "book_cost", "vendor_name", "source", "accession_number", "cover_image",

            # digital / electronic info
            "storage_type", "file_url", "digital_identifier", "format",

            # cataloging info
            "library_section", "dewey_decimal", "cataloger", "remarks",

            # system
            "added_date", "updated_at", "is_active",

            # copy information
            "copies_count", "copies",
        ]
        read_only_fields = [
            "id", "uid", "book_code", "added_date", "updated_at",
            "copies_count", "copies",
        ]

    # ------------------------------------------------------------------
    # Validation Helpers
    # ------------------------------------------------------------------
    def validate_quantity(self, value):
        if value is None:
            return 1
        try:
            value = int(value)
            if value < 0:
                raise serializers.ValidationError("Quantity must be >= 0")
            return value
        except Exception:
            raise serializers.ValidationError("Quantity must be an integer")

    def validate_publication_year(self, value):
        if value and (value < 1500 or value > timezone.now().year + 1):
            raise serializers.ValidationError("Invalid publication year.")
        return value

    def validate_isbn(self, value):
        if not value:
            return value
        normalized = str(value).replace("-", "").strip()
        qs = Book.objects.filter(isbn=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("ISBN already exists in another record.")
        return normalized

    def validate_book_cost(self, value):
        if value is None:
            return None
        try:
            value = round(float(value), 2)
            if value < 0:
                raise serializers.ValidationError("Book cost cannot be negative.")
            return value
        except Exception:
            raise serializers.ValidationError("Invalid book cost format.")

    # ------------------------------------------------------------------
    # Creation / Update Logic
    # ------------------------------------------------------------------
    def create(self, validated_data):
        """
        Create a new Book with specified quantity.
        After saving, create corresponding BookCopy entries.
        """
        quantity = validated_data.pop("quantity", 1)
        book = Book.objects.create(**validated_data)
        if quantity and quantity > 0:
            book.create_copies(quantity)
        return book

    def update(self, instance, validated_data):
        """
        Update metadata fields only.
        Quantity changes are ignored during edit — handled by copy CRUD ops.
        """
        validated_data.pop("quantity", None)  # locked during edit
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ======================================================================
# AUDIT LOG SERIALIZER
# ======================================================================
class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.ReadOnlyField(source="actor.id")

    class Meta:
        model = AuditLog
        fields = "__all__"


# ======================================================================
# BULK IMPORT SERIALIZER (for Excel uploads)
# ======================================================================
class BulkBookImportSerializer(serializers.Serializer):
    """Used internally for validating Excel/CSV import rows (full metadata)."""

    # --- Core Info ---
    title = serializers.CharField(max_length=300)
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    author = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    publisher = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    edition = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    publication_year = serializers.IntegerField(required=False, allow_null=True)
    isbn = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    language = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    keywords = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # --- Inventory ---
    quantity = serializers.IntegerField(required=False, allow_null=True, default=1)
    shelf_location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    condition = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    availability_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # --- Financial / Vendor Info ---
    book_cost = serializers.DecimalField(
        required=False, allow_null=True, max_digits=8, decimal_places=2
    )
    vendor_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    source = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    accession_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    barcode_prefix = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # --- Digital / Electronic Info ---
    storage_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    file_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    digital_identifier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    format = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    qr_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # --- Cataloging Info ---
    library_section = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dewey_decimal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cataloger = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if not data.get("title"):
            raise serializers.ValidationError({"title": "Book title is required."})
        return data
