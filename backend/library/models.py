from django.db import models
from django.conf import settings


class Book(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("borrowed", "Borrowed"),
        ("unavailable", "Unavailable"),
    ]

    book_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=False, null=True, blank=True)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=1)
    publication = models.CharField(max_length=150, blank=True, null=True)
    edition = models.CharField(max_length=50, blank=True, null=True)
    shelf_number = models.CharField(max_length=30, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    publisher = models.CharField(max_length=150, blank=True, null=True)
    published_date = models.DateField(blank=True, null=True)
    cover_image = models.ImageField(
        upload_to="book_covers/", blank=True, null=True
    )  # ✅ for book cover uploads
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="available"
    )
    added_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author}"


class BorrowRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("returned", "Returned"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="borrow_requests"
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrow_requests")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    request_date = models.DateTimeField(auto_now_add=True)
    issue_date = models.DateField(blank=True, null=True)
    return_date = models.DateField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.book.title} ({self.status})"
