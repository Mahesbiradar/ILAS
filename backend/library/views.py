from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from .models import Book, BorrowRequest
from .serializers import BookSerializer, BorrowRequestSerializer
from .permissions import IsAdminOrReadOnly


# 🔹 BOOK VIEWSET (User = read only, Admin = CRUD)
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-added_date')
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    # ✅ Users can filter by category or title
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        if category:
            queryset = queryset.filter(category__icontains=category)
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset


# 🔹 BORROW REQUEST VIEWSET (For Users & Admins)
class BorrowRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowRequestSerializer
    queryset = BorrowRequest.objects.all().select_related("user", "book")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Normal users see only their own requests
        if not user.is_staff and not user.role == "admin":
            return BorrowRequest.objects.filter(user=user).select_related("book")
        return BorrowRequest.objects.all().select_related("user", "book")

    def perform_create(self, serializer):
        """
        When a user creates a borrow request, attach the current user automatically.
        """
        serializer.save(user=self.request.user)

    # 🔹 Admin-only actions for approving / rejecting / marking returned
    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        borrow_req = self.get_object()
        borrow_req.status = "approved"
        borrow_req.save()
        borrow_req.book.status = "borrowed"
        borrow_req.book.save()
        return Response({"message": "Borrow request approved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        borrow_req = self.get_object()
        borrow_req.status = "rejected"
        borrow_req.save()
        return Response({"message": "Borrow request rejected."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def mark_returned(self, request, pk=None):
        borrow_req = self.get_object()
        borrow_req.status = "returned"
        borrow_req.book.status = "available"
        borrow_req.book.save()
        borrow_req.save()
        return Response({"message": "Book marked as returned."}, status=status.HTTP_200_OK)
