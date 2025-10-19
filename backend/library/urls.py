from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BorrowRequestViewSet


router = DefaultRouter()
router.register(r'books', BookViewSet ,basename='book')
router.register(r'borrow', BorrowRequestViewSet, basename='borrow')


urlpatterns = [
    path('', include(router.urls)),
]
