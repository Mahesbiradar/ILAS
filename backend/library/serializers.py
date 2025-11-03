# library/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Book, BookCopy, Transaction, AuditLog

User = get_user_model()


class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_code = serializers.CharField(source="book.book_code", read_only=True)
    book_pk = serializers.IntegerField(source="book.id", read_only=True)

    class Meta:
        model = BookCopy
        fields = [
            "id",
            "copy_id",
            "barcode_value",
            "barcode_image",
            "condition",
            "status",
            "location",
            "created_at",
            "book",
            "book_pk",
            "book_title",
            "book_code",
        ]
        read_only_fields = ["id", "copy_id", "barcode_value", "created_at", "book_pk", "book_title", "book_code"]

    def validate(self, attrs):
        # Only allow certain status values (reuse model choices)
        status = attrs.get("status")
        if status:
            allowed = {choice[0] for choice in BookCopy._meta.get_field("status").choices}
            if status not in allowed:
                raise serializers.ValidationError({"status": f"Invalid status '{status}'. Allowed: {allowed}"})
        return attrs


class BookSerializer(serializers.ModelSerializer):
    copies = BookCopySerializer(many=True, read_only=True)
    class Meta:
        model = Book
        fields = [
            "id",
            "book_code",
            "title",
            "author",
            "isbn",
            "category",
            "quantity",
            "cover_image",
            "added_date",
            "is_active",
            "copies",
        ]
        read_only_fields = ["id", "book_code", "added_date", "copies"]

    def validate_quantity(self, value):
        if value is None:
            return 1
        try:
            v = int(value)
            if v < 0:
                raise serializers.ValidationError("quantity must be >= 0")
            return v
        except Exception:
            raise serializers.ValidationError("quantity must be an integer")

    def create(self, validated_data):
        """Create a new book and its copies."""
        qty = validated_data.get("quantity", 1)
        book = Book.objects.create(**validated_data)
        for _ in range(qty):
            BookCopy.objects.create(book=book)
        return book

    def update(self, instance, validated_data):
        """Safely update book and handle quantity changes."""
        new_quantity = validated_data.get("quantity", instance.quantity)
        prev_quantity = instance.quantity

        instance = super().update(instance, validated_data)

        # Adjust copies if quantity changes
        if new_quantity > prev_quantity:
            diff = new_quantity - prev_quantity
            for _ in range(diff):
                BookCopy.objects.create(book=instance)
        elif new_quantity < prev_quantity:
            # delete extra copies (only available ones)
            diff = prev_quantity - new_quantity
            available_copies = instance.copies.filter(status="available")[:diff]
            for c in available_copies:
                c.delete()

        return instance


class TransactionSerializer(serializers.ModelSerializer):
    book_copy = serializers.PrimaryKeyRelatedField(queryset=BookCopy.objects.all())
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    created_by = serializers.ReadOnlyField(source="created_by.id")

    class Meta:
        model = Transaction
        fields = [
            "id", "book_copy", "user", "type", "issued_at", "due_at", "returned_at",
            "status", "fine_amount", "notes", "created_by", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "status", "fine_amount", "created_by", "created_at", "updated_at", "returned_at"]

    def validate(self, data):
        ttype = data.get("type")
        copy = data.get("book_copy")
        if ttype == Transaction.TYPE_ISSUE and copy.status != "available":
            raise serializers.ValidationError({"book_copy": "Book copy is not available for issue."})
        return data

    def create(self, validated_data):
        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None
        txn = Transaction.objects.create(
            book_copy=validated_data["book_copy"],
            user=validated_data["user"],
            type=validated_data.get("type", Transaction.TYPE_ISSUE),
            issued_at=validated_data.get("issued_at") or timezone.now(),
            due_at=validated_data.get("due_at"),
            notes=validated_data.get("notes"),
            created_by=created_by,
        )
        # update copy status
        copy = txn.book_copy
        copy.status = "issued"
        copy.save()
        return txn


class TransactionReturnSerializer(serializers.Serializer):
    return_notes = serializers.CharField(required=False, allow_blank=True)
    force = serializers.BooleanField(required=False, default=False)


class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.ReadOnlyField(source="actor.id")

    class Meta:
        model = AuditLog
        fields = "__all__"
