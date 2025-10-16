from rest_framework import viewsets,permissions
from .models import Book
from .serializers import BookSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-book_id')
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]
