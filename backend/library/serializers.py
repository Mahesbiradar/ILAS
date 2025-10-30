# library/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Book, BookCopy, Transaction, AuditLog

User = get_user_model()


class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.ReadOnlyField(source="book.title")
    book_code = serializers.ReadOnlyField(source="book.book_code")

    class Meta:
        model = BookCopy
        fields = [
            "id",
            "copy_id",
            "barcode_value",
            "barcode_image",
            "book",
            "book_code",
            "book_title",
            "status",
            "condition",
            "location",
            "created_at",
        ]
        read_only_fields = ["copy_id", "barcode_value", "barcode_image", "created_at"]


class BookSerializer(serializers.ModelSerializer):
    copies = BookCopySerializer(many=True, read_only=True)
    book_id = serializers.ReadOnlyField(source="book_code")

    class Meta:
        model = Book
        fields = [
            "id",
            "book_id",
            "book_code",
            "title",
            "author",
            "isbn",
            "category",
            "quantity",
            "cover_image",
            "added_date",
            "copies",
        ]
        read_only_fields = ["id", "book_id", "book_code", "added_date"]

    def create(self, validated_data):
        # Book.save() will auto-create copies based on quantity
        book = Book.objects.create(**validated_data)
        return book

    def update(self, instance, validated_data):
        new_quantity = int(validated_data.get("quantity", instance.quantity))
        prev_quantity = instance.quantity
        instance = super().update(instance, validated_data)
        # Add copies if quantity increased
        if new_quantity > prev_quantity:
            for _ in range(new_quantity - prev_quantity):
                BookCopy.objects.create(book=instance)
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
