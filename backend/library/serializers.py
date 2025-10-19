from rest_framework import serializers
from .models import Book, BorrowRequest
from accounts.serializers import UserSerializer  # ✅ For nested user info


# 🔹 BOOK SERIALIZER
class BookSerializer(serializers.ModelSerializer):
    # Return full URL for cover_image
    cover_image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Book
        fields = [
            "book_id",
            "title",
            "author",
            "isbn",
            "category",
            "quantity",
            "publication",
            "edition",
            "shelf_number",
            "description",
            "publisher",
            "published_date",
            "cover_image",
            "cover_image_url",
            "status",
            "added_date",
        ]

    def get_cover_image_url(self, obj):
        request = self.context.get("request")
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None


# 🔹 BORROW REQUEST SERIALIZER
class BorrowRequestSerializer(serializers.ModelSerializer):
    # Include nested user and book details (read-only)
    user = UserSerializer(read_only=True)
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(), source="book", write_only=True
    )

    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "user",
            "book",
            "book_id",
            "status",
            "request_date",
            "issue_date",
            "return_date",
            "remarks",
        ]
        read_only_fields = ["id", "request_date", "status"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        return super().create(validated_data)
