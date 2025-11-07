# backend/accounts/views.py
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import action, api_view, permission_classes
from django.http import HttpResponse
from .permissions import IsRealAdmin

from .models import User, MemberLog, PasswordResetOTP
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    MemberLogSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
)

from django.core.mail import send_mail
from django.conf import settings
import csv
import io
from datetime import datetime
from django.utils import timezone

# Helper to generate JWT tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# REGISTER VIEW
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable JWTAuth for signup

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
                "message": "User registered successfully!",
            },
            status=status.HTTP_201_CREATED,
        )


# LOGIN VIEW
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # Accept username or email
        username_or_email = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not username_or_email or not password:
            return Response(
                {"detail": "Both username/email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username_or_email, password=password)
        if user is None:
            # attempt email match (case-insensitive)
            try:
                found_user = User.objects.filter(email__iexact=username_or_email).first()
                if found_user and found_user.check_password(password):
                    user = found_user
            except Exception:
                pass

        if user is None:
            return Response({"detail": "Invalid username/email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"detail": "User account is inactive. Contact admin."}, status=status.HTTP_403_FORBIDDEN)

        # set is_logged_in flag
        user.is_logged_in = True
        user.save(update_fields=["is_logged_in"])

        if user.is_superuser and not user.role:
            user.role = "admin"
            user.save(update_fields=["role"])

        tokens = get_tokens_for_user(user)
        return Response({"user": UserSerializer(user).data, "tokens": tokens, "message": "Login successful."}, status=status.HTTP_200_OK)


# USER PROFILE
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/auth/me/ — return current user data"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """PATCH /api/auth/me/ — update user profile fields"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated successfully!", "user": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ADMIN: LIST ALL USERS
class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


# ADMIN: UPDATE/DELETE USERS
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


# MemberViewSet (keeps same behavior)
class MemberViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-id")
    permission_classes = [AllowAny]  # change to IsAdminUser if needed

    def get_serializer_class(self):
        if self.action == "create":
            return RegisterSerializer
        return UserSerializer

    def perform_create(self, serializer):
        member = serializer.save()
        MemberLog.objects.create(
            member=member.username,
            action="added",
            performed_by=self.request.user.username if self.request.user.is_authenticated else "system",
        )

    def perform_update(self, serializer):
        member = serializer.save()
        MemberLog.objects.create(
            member=member.username,
            action="edited",
            performed_by=self.request.user.username if self.request.user.is_authenticated else "system",
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_logged_in:
            return Response({"error": "Cannot delete a logged-in user."}, status=status.HTTP_400_BAD_REQUEST)
        MemberLog.objects.create(member=instance.username, action="deleted", performed_by=self.request.user.username if self.request.user.is_authenticated else "system")
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def promote(self, request, pk=None):
        member = self.get_object()
        role_order = ["user", "librarian", "admin"]
        try:
            next_role = role_order[role_order.index(member.role) + 1]
        except (ValueError, IndexError):
            next_role = "admin"

        member.role = next_role
        if next_role == "admin":
            member.is_staff = True
        member.save()

        MemberLog.objects.create(member=member.username, action="promoted", performed_by=request.user.username if request.user.is_authenticated else "system")
        return Response(UserSerializer(member).data)


# Member logs
@api_view(["GET"])
@permission_classes([IsRealAdmin])
def member_logs(request):
    logs = MemberLog.objects.all().order_by("-timestamp")
    serializer = MemberLogSerializer(logs, many=True)
    return Response(serializer.data)


# Export member logs (CSV)
@api_view(["GET"])
@permission_classes([IsRealAdmin])
def export_member_logs(request):
    start_date = request.query_params.get("start")
    end_date = request.query_params.get("end")

    logs = MemberLog.objects.all().order_by("-timestamp")
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            logs = logs.filter(timestamp__date__range=(start, end))
        except ValueError:
            return Response({"error": "Invalid date format (YYYY-MM-DD required)."}, status=status.HTTP_400_BAD_REQUEST)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Member", "Action", "Performed By", "Timestamp"])
    for log in logs:
        writer.writerow([log.member, log.action, log.performed_by, log.timestamp.strftime("%Y-%m-%d %H:%M:%S")])

    csv_data = output.getvalue()
    output.close()
    response = HttpResponse(csv_data, content_type="text/csv")
    filename = f"member_logs_{start_date or 'all'}_{end_date or 'all'}.csv"
    response["Content-Disposition"] = f"attachment; filename={filename}"
    return response


@api_view(["GET"])
@permission_classes([IsRealAdmin])
def export_all_members(request):
    users = User.objects.all().order_by("-id")
    if not users.exists():
        return Response({"error": "No members found."}, status=status.HTTP_404_NOT_FOUND)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Username", "Email", "Phone", "UniqueID", "Role", "Joined On"])

    for user in users:
        writer.writerow([user.id, user.username, user.email, user.phone or "", user.unique_id or "", user.role or "", user.date_joined.strftime("%Y-%m-%d %H:%M:%S")])

    csv_data = output.getvalue()
    output.close()
    response = HttpResponse(csv_data, content_type="text/csv")
    filename = f'all_members_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


# -------------------- Password Reset (OTP) --------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def send_reset_otp(request):
    """
    Request body: {"email": "<user email>"}
    This creates an OTP, emails it to the user (if user exists), and returns a success message.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        # Do not reveal whether the email exists — return generic message
        return Response({"message": "If an account with that email exists, an OTP has been sent."})

    # generate OTP and save
    otp = PasswordResetOTP.generate_otp()
    pr = PasswordResetOTP.objects.create(user=user, otp_code=otp)

    # send email (simple). Make sure EMAIL settings are configured (DEFAULT_FROM_EMAIL)
    try:
        send_mail(
            subject="ILAS Password Reset OTP",
            message=f"Your password reset OTP is: {otp}\nThis code is valid for {pr.EXPIRY_MINUTES} minutes.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ilas.local"),
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        # If email fails, still return generic response
        pass

    return Response({"message": "If an account with that email exists, an OTP has been sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Request body: {"email":"<email>", "otp":"123456", "new_password":"pass123"}
    """
    serializer = PasswordResetVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp"]
    new_password = serializer.validated_data["new_password"]

    pr = PasswordResetOTP.objects.filter(user__email__iexact=email, otp_code=otp, is_used=False).order_by("-created_at").first()
    if not pr or not pr.is_valid():
        return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

    user = pr.user
    user.set_password(new_password)
    user.save(update_fields=["password"])

    pr.mark_used()
    return Response({"message": "Password has been reset successfully."})

# backend/accounts/views.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ProfileImageSerializer, PasswordChangeSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_image(request):
    """POST /api/auth/me/upload/ — Upload or update profile picture."""
    serializer = ProfileImageSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Profile image updated successfully!", "image": serializer.data["profile_image"]},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/auth/me/change-password/
    """
    serializer = PasswordChangeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    # Check old password
    if not user.check_password(old_password):
        return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    # Apply password validation and save
    try:
        user.set_password(new_password)
        user.save()
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "Password changed successfully!"}, status=status.HTTP_200_OK)

