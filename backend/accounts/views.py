from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# 🔹 REGISTER VIEW (Signup)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable JWTAuth for signup

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-login after signup
        tokens = get_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "tokens": tokens,
            "message": "User registered successfully!"
        }, status=status.HTTP_201_CREATED)


# 🔹 LOGIN VIEW (Enhanced for Admin/Superusers)
class LoginView(APIView):
    """
    Handles user login for both normal and admin users.
    Allows login using either username or email.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable JWTAuth for login

    def post(self, request):
        username_or_email = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not username_or_email or not password:
            return Response(
                {"detail": "Both username/email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Try username first
        user = authenticate(request, username=username_or_email, password=password)

        # Try email if username fails
        if user is None:
            try:
                found_user = User.objects.filter(email__iexact=username_or_email).first()
                if found_user and found_user.check_password(password):
                    user = found_user
            except Exception:
                pass

        # Validation checks
        if user is None:
            return Response(
                {"detail": "Invalid username/email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "User account is inactive. Contact admin."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Ensure admins/superusers can log in
        if user.is_superuser and not user.role:
            user.role = "admin"
            user.save(update_fields=["role"])

        # Everything valid — issue tokens
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )


# 🔹 USER PROFILE (Authenticated)
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


# 🔹 ADMIN: LIST ALL USERS
class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


# 🔹 ADMIN: UPDATE OR DELETE USERS
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
