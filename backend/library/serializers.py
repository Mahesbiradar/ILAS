# library/serializers.py
from decimal import Decimal
from typing import Any, Dict

from django.utils import timezone
from rest_framework import serializers

from .models import Book, BookTransaction, AuditLog
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.exceptions import ValidationError as DRFValidationError
User = get_user_model()


class BookSerializer(serializers.ModelSerializer):
    issued_to_name = serializers.ReadOnlyField(source="issued_to.username", default=None)
    last_modified_by_name = serializers.ReadOnlyField(source="last_modified_by.username", default=None)
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "uid", "book_code",
            "title", "subtitle", "author", "publisher", "edition", "publication_year",
            "isbn", "language", "category", "keywords", "description",
            "accession_no", "shelf_location", "condition", "book_cost",
            "vendor_name", "source", "library_section", "dewey_decimal",
            "cataloger", "remarks", "cover_image", "cover_url",
            "status", "issued_to", "issued_to_name",
            "last_modified_by", "last_modified_by_name",
            "created_at", "updated_at", "is_active",
        ]
        read_only_fields = [
            "id", "uid", "book_code",
            "issued_to_name", "last_modified_by_name",
            "created_at", "updated_at",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        return ret

    def get_cover_url(self, obj):
        # 1. Single book upload (already stored in DB)
        if obj.cover_image:
            try:
                return obj.cover_image.url
            except Exception:
                pass

        # 2. Bulk upload (resolve via ISBN)
        if obj.isbn:
            isbn = obj.isbn.replace("-", "").strip()
            return f"{settings.CLOUDINARY_BOOK_COVER_BASE}/{isbn}.jpg"

        # 3. Final fallback
        return settings.DEFAULT_BOOK_COVER


    def validate(self, attrs):
        # Ensure API create has defaults for required fields
        attrs.setdefault("category", "General")
        attrs.setdefault("shelf_location", "Unassigned")
        return attrs

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
        if instance.status == Book.STATUS_ISSUED:
            raise serializers.ValidationError("Cannot edit a book that is currently issued.")
        return super().update(instance, validated_data)


# library/serializers.py
# ... (keep top-of-file imports as-is)
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError as DRFValidationError

User = get_user_model()

class BookTransactionSerializer(serializers.ModelSerializer):
    member_name = serializers.ReadOnlyField(source="member.username")
    member_unique_id = serializers.ReadOnlyField(source="member.unique_id", default=None)
    actor_name = serializers.ReadOnlyField(source="actor.username", default=None)
    book_code = serializers.ReadOnlyField(source="book.book_code")
    book_title = serializers.ReadOnlyField(source="book.title")
    action_date = serializers.SerializerMethodField()

    # Accept frontend payload: book_id and member_id (write-only)
    book_id = serializers.IntegerField(write_only=True, required=False)
    member_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = BookTransaction
        fields = [
            "id",
            "txn_type",
            "book_code",
            "book_title",
            "member_name",
            "member_unique_id",
            "actor_name",
            "issue_date",
            "due_date",
            "return_date",
            "action_date",
            "fine_amount",
            "remarks",
            "is_active",
            "created_at",

            # Write-only inputs (frontend)
            "book_id",
            "member_id",
        ]
        # Keep display fields readonly; write-only fields are omitted from read-only list
        read_only_fields = [
            "id",
            "book_code",
            "book_title",
            "member_name",
            "member_unique_id",
            "actor_name",
            "issue_date",
            "due_date",
            "return_date",
            "action_date",
            "fine_amount",
            "is_active",
            "created_at",
        ]

    def get_action_date(self, obj):
        """Return ISO formatted datetime for API table display (page uses it)."""
        if obj.txn_type == BookTransaction.TYPE_ISSUE:
            return obj.issue_date.isoformat() if obj.issue_date else None
        if obj.txn_type == BookTransaction.TYPE_RETURN:
            return obj.return_date.isoformat() if obj.return_date else None
        return obj.created_at.isoformat() if obj.created_at else None

    def _resolve_book_and_member(self, attrs):
        """Helper to get actual Book and User instances from either supplied objects or ids."""
        # Book resolution (book may be provided by callers, but our API posts book_id)
        book = attrs.get("book")
        if not book:
            book_id = attrs.pop("book_id", None) or self.initial_data.get("book_id")
            if book_id:
                try:
                    book = Book.objects.get(pk=book_id)
                except Book.DoesNotExist:
                    raise DRFValidationError({"book_id": "Invalid book_id."})
                attrs["book"] = book

        # Member resolution
        member = attrs.get("member")
        if not member:
            member_id = attrs.pop("member_id", None) or self.initial_data.get("member_id")
            if member_id:
                try:
                    member = User.objects.get(pk=member_id)
                except User.DoesNotExist:
                    raise DRFValidationError({"member_id": "Invalid member_id."})
                attrs["member"] = member

        return attrs

    def validate(self, attrs):
        # Ensure we resolve ids -> instances before performing validation logic.
        attrs = self._resolve_book_and_member(dict(attrs))  # copy to avoid mutating original too early

        txn_type = attrs.get("txn_type")
        book = attrs.get("book")
        member = attrs.get("member")

        if not book:
            raise DRFValidationError({"book": "Book is required."})
        if not member and txn_type == BookTransaction.TYPE_ISSUE:
            # ISSUE needs a member
            raise DRFValidationError({"member": "Member is required for ISSUE."})

        # ISSUE validation (reuse business rules)
        if txn_type == BookTransaction.TYPE_ISSUE:
            if not book.can_be_issued():
                raise DRFValidationError({"book": "Book is not available for issue."})
            if not getattr(member, "is_active", True):
                raise DRFValidationError({"member": "Member is not active."})
            if BookTransaction.objects.filter(book=book, txn_type=BookTransaction.TYPE_ISSUE, is_active=True).exists():
                raise DRFValidationError({"book": "Book already has an active issue."})

        # RETURN validation
        if txn_type == BookTransaction.TYPE_RETURN:
            active_issue = BookTransaction.objects.filter(book=book, txn_type=BookTransaction.TYPE_ISSUE, is_active=True).first()
            if not active_issue:
                raise DRFValidationError({"txn_type": "No active ISSUE for this book."})
            # if a member is supplied ensure it matches the active issue owner
            if member and active_issue.member and (active_issue.member.pk != member.pk):
                raise DRFValidationError({"member": "Return must be by same member who issued the book."})
            ret_date = attrs.get("return_date")
            if ret_date and ret_date > timezone.now():
                raise DRFValidationError({"return_date": "Return date cannot be in the future."})

        return attrs

    def create(self, validated_data):
        # Ensure book/member instances are present
        validated_data = self._resolve_book_and_member(dict(validated_data))

        txn_type = validated_data.get("txn_type")
        book = validated_data.get("book")
        member = validated_data.get("member")
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        remarks = validated_data.get("remarks", "")

        # Use model methods to preserve atomic behaviour / fines / audit creation
        if txn_type == BookTransaction.TYPE_ISSUE:
            return book.mark_issued(member=member, actor=actor, remarks=remarks)

        elif txn_type == BookTransaction.TYPE_RETURN:
            return book.mark_returned(actor=actor, returned_by=member, remarks=remarks)

        elif txn_type in {
            BookTransaction.TYPE_LOST,
            BookTransaction.TYPE_DAMAGED,
            BookTransaction.TYPE_MAINTENANCE,
            BookTransaction.TYPE_REMOVED,
        }:
            return book.mark_status(txn_type, actor=actor, remarks=remarks)

        raise DRFValidationError({"txn_type": "Invalid transaction type."})

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor", "actor_name", "action", "target_type", "target_id",
            "old_values", "new_values", "remarks", "source", "timestamp",
        ]
        read_only_fields = ["id", "timestamp", "actor_name"]

    def get_actor_name(self, obj):
        return getattr(obj.actor, "username", "System")


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
    accession_no = serializers.CharField(required=False, allow_blank=True , allow_null=True)
    library_section = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dewey_decimal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cataloger = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        """Normalize None -> '' and ensure required fields present."""
        for field, value in list(attrs.items()):
            if value is None:
                attrs[field] = ""
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
        book._suppress_audit = False
        return book

# ----------------------------------------------------------------------
# PUBLIC SERIALIZER (Safe for Student/Members)
# ----------------------------------------------------------------------
class PublicBookSerializer(serializers.ModelSerializer):
    issued_to_name = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()


    class Meta:
        model = Book
        fields = [
            "id", "book_code", "title", "author", "isbn", "category",
            "status", "shelf_location", "issued_to_name","cover_url",
        ]

    def get_issued_to_name(self, obj):
        return obj.issued_to.username if obj.issued_to else None
    def get_cover_url(self, obj):
        # 1. Preserve single book uploads
        if obj.cover_image:
            try:
                return obj.cover_image.url
            except Exception:
                pass

        # 2. Resolve bulk-uploaded books via ISBN
        if obj.isbn:
            isbn = obj.isbn.replace("-", "").strip()
            return f"{settings.CLOUDINARY_BOOK_COVER_BASE}/{isbn}.jpg"

        # 3. Fallback to default cover
        return settings.DEFAULT_BOOK_COVER
