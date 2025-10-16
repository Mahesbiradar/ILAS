from django.db import models

class Book(models.Model):
    book_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=1)
    added_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author}"
