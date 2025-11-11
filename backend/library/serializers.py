# library/serializers.py
"""
ILAS – Final DRF Serializers (Audit-Safe, Non-Recursive)
--------------------------------------------------------
• Book CRUD (status-safe)
• BookTransaction validation (Issue / Return / Lost / Damaged / etc.)
• AuditLog exposure
• Bulk Book Import validation (Excel rows)
• Fully aligned with corrected models, signals, and admin
"""

from decimal import Decimal
from typing import Any, Dict, Optional

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Book, BookTransaction, AuditLog


# ----------------------------------------------------------------------
#  Book Serializer
# ----------------------------------------------------------------------
class BookSerializer(serializers.ModelSerializer):
    issued_to_name = serializers.ReadOnlyField(source="issued_to.username", default=None)
    last_modified_by_name = serializers.ReadOnlyField(source="last_modified_by.username", default=None)

    class Meta:
        model = Book
        fields = [
            "id", "uid", "book_code",
            "title", "subtitle", "author", "publisher", "edition", "publication_year",
            "isbn", "language", "category", "keywords", "description",
            "accession_no", "shelf_location", "condition", "book_cost",
            "vendor_name", "source", "library_section", "dewey_decimal",
            "cataloger", "remarks", "cover_image",
            "status", "issued_to", "issued_to_name",
            "last_modified_by", "last_modified_by_name",
            "created_at", "updated_at", "is_active",
        ]
        read_only_fields = [
            "id", "uid", "book_code",
            "issued_to_name", "last_modified_by_name",
            "created_at", "updated_at",
        ]

    def validate_status(self, value):
        valid = [k for k, _ in Book.STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError("Invalid status.")
        return value

    def update(self, instance, validated_data):
        # Prevent direct ISSUED status changes
        if "status" in validated_data and validated_data["status"] == Book.STATUS_ISSUED:
            raise serializers.ValidationError(
                {"status": "Cannot manually set to ISSUED — use BookTransaction ISSUE instead."}
            )

        # Prevent edits when book is issued
        if instance.status == Book.STATUS_ISSUED:
            raise serializers.ValidationError("Cannot edit a book that is currently issued.")

        return super().update(instance, validated_data)


# ----------------------------------------------------------------------
#  BookTransaction Serializer
# ----------------------------------------------------------------------
class BookTransactionSerializer(serializers.ModelSerializer):
    member_name = serializers.ReadOnlyField(source="member.username")
    actor_name = serializers.ReadOnlyField(source="actor.username", default=None)
    book_code = serializers.ReadOnlyField(source="book.book_code")
    book_title = serializers.ReadOnlyField(source="book.title")
    book_status = serializers.ReadOnlyField(source="book.status")

    class Meta:
        model = BookTransaction
        fields = [
            "id", "book", "book_code", "book_title", "book_status",
            "member", "member_name", "actor", "actor_name",
            "txn_type", "issue_date", "due_date", "return_date",
            "fine_amount", "remarks", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "book_code", "book_title", "book_status",
            "member_name", "actor_name",
            "issue_date", "due_date", "return_date",
            "fine_amount", "created_at", "updated_at",
        ]

    def validate(self, attrs: Dict[str, Any]):
        txn_type = attrs.get("txn_type")
        book = attrs.get("book")
        member = attrs.get("member")

        if not book:
            raise serializers.ValidationError({"book": "Book is required."})
        if not member:
            raise serializers.ValidationError({"member": "Member is required."})

        # ISSUE validation
        if txn_type == BookTransaction.TYPE_ISSUE:
            if not book.can_be_issued():
                raise serializers.ValidationError({"book": "Book is not available for issue."})
            if BookTransaction.objects.filter(book=book, is_active=True, txn_type=BookTransaction.TYPE_ISSUE).exists():
                raise serializers.ValidationError({"book": "This book already has an active issue."})

        # RETURN validation
        elif txn_type == BookTransaction.TYPE_RETURN:
            active_issue = BookTransaction.objects.filter(
                book=book, member=member, is_active=True, txn_type=BookTransaction.TYPE_ISSUE
            ).first()
            if not active_issue:
                raise serializers.ValidationError({"txn_type": "No active ISSUE for this book and member."})

        return attrs

    def create(self, validated_data):
        """Creates a BookTransaction respecting model logic and audit flow."""
        request = self.context.get("request")
        actor = None
        if request and hasattr(request, "user"):
            actor = request.user
        validated_data["actor"] = actor

        book = validated_data["book"]
        txn_type = validated_data["txn_type"]
        member = validated_data["member"]
        remarks = validated_data.get("remarks", "")

        with transaction.atomic():
            if txn_type == BookTransaction.TYPE_ISSUE:
                txn = book.mark_issued(member=member, actor=actor, remarks=remarks)
            elif txn_type == BookTransaction.TYPE_RETURN:
                txn = book.mark_returned(actor=actor, remarks=remarks)
            elif txn_type in [
                BookTransaction.TYPE_LOST,
                BookTransaction.TYPE_DAMAGED,
                BookTransaction.TYPE_MAINTENANCE,
                BookTransaction.TYPE_REMOVED,
            ]:
                txn = book.mark_status(txn_type, actor=actor, remarks=remarks)
            else:
                raise serializers.ValidationError({"txn_type": "Invalid transaction type."})
            return txn


# ----------------------------------------------------------------------
#  AuditLog Serializer
# ----------------------------------------------------------------------
class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source="actor.username", default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor", "actor_name", "action", "target_type", "target_id",
            "old_values", "new_values", "remarks", "source", "timestamp",
        ]
        read_only_fields = ["id", "timestamp", "actor_name"]


# ----------------------------------------------------------------------
#  Bulk Book Import Serializer
# ----------------------------------------------------------------------
class BulkBookImportSerializer(serializers.Serializer):
    """Validates each Excel row for bulk uploads."""

    # Required fields
    title = serializers.CharField(max_length=400)
    author = serializers.CharField(max_length=400)
    isbn = serializers.CharField(max_length=64)
    category = serializers.CharField(max_length=128)
    shelf_location = serializers.CharField(max_length=128)

    # Optional fields
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    publisher = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    edition = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    publication_year = serializers.IntegerField(required=False, allow_null=True)
    language = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="English")
    keywords = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    condition = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="Good")
    book_cost = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
    vendor_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    source = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    accession_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    library_section = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dewey_decimal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cataloger = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        """Normalize None → '' for all text fields."""
        for field, value in attrs.items():
            if value is None:
                attrs[field] = ""
        # Ensure required fields exist
        if not attrs.get("title"):
            raise serializers.ValidationError({"title": "Title is required."})
        if not attrs.get("author"):
            raise serializers.ValidationError({"author": "Author is required."})
        if not attrs.get("isbn"):
            raise serializers.ValidationError({"isbn": "ISBN is required."})
        if not attrs.get("category"):
            raise serializers.ValidationError({"category": "Category is required."})
        if not attrs.get("shelf_location"):
            raise serializers.ValidationError({"shelf_location": "Shelf location is required."})
        return attrs


    def validate_publication_year(self, value):
        if value is None:
            return value
        try:
            year = int(value)
            if year < 0 or year > timezone.now().year:
                raise serializers.ValidationError("Invalid publication year.")
        except (TypeError, ValueError):
            raise serializers.ValidationError("Invalid publication year.")
        return year

    def create_book_instance(self, validated_row: Dict[str, Any], created_by=None) -> Book:
        """Create and return a Book instance from validated Excel row (audit-safe)."""
        book_data = {k: v for k, v in validated_row.items() if v not in ("", None)}
        if created_by:
            book_data["last_modified_by"] = created_by

        # Create instance without triggering post_save audits first
        book = Book(**book_data)
        book._suppress_audit = True  # mark before saving to skip per-row audits
        book.save()
        return book
