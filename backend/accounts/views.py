from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer


# 🔹 REGISTER VIEW (Signup)
class RegisterView(generics.CreateAPIView):
    """
    Handles user registration with validation and JWT token generation.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Validation Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        data = {
            "user": UserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            "message": "User registered successfully!"
        }
        return Response(data, status=status.HTTP_201_CREATED)


# 🔹 LOGIN VIEW
class LoginView(APIView):
    """
    Handles user login and returns JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "message": "Login successful."
        }, status=status.HTTP_200_OK)


# 🔹 USER PROFILE VIEW (Authenticated)
class UserProfileView(APIView):
    """
    Returns the current user's profile data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 🔹 ADMIN: LIST ALL USERS
class UserListView(generics.ListAPIView):
    """
    Admin-only: view all registered users.
    """
    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


# 🔹 ADMIN: UPDATE OR DELETE USERS
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin-only: view, update or delete individual users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
