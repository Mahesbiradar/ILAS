# backend/accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password

from .models import User, MemberLog, PasswordResetOTP


# =====================================================
# USER SERIALIZER (Used everywhere safely)
# =====================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "username",
            "email",
            "role",
            "phone",
            "unique_id",
            "department",
            "year",
            "designation",
            "is_active",
            "is_verified",
            "is_logged_in",
            "date_joined",
            "last_login",

        ]
        read_only_fields = [
            "id",
            "is_logged_in",
            "is_verified",
            "date_joined",
        ]


# =====================================================
# REGISTER / SIGNUP SERIALIZER
# =====================================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "first_name",       # ✅ REQUIRED NOW
            "username",
            "email",
            "password",
            "confirm_password",
            "role",
            "phone",
            "unique_id",        # USN / Employee ID
            "department",
            "year",
            "designation",
        ]

    def validate(self, data):
        # ---- Password match check ----
        if data.get("confirm_password"):
            if data["password"] != data["confirm_password"]:
                raise serializers.ValidationError(
                    {"password": "Passwords do not match."}
                )

        # ---- Email uniqueness ----
        email = data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )

        # ---- Unique ID (USN / Employee ID) uniqueness ----
        unique_id = data.get("unique_id")
        if unique_id and User.objects.filter(unique_id__iexact=unique_id).exists():
            raise serializers.ValidationError(
                {"unique_id": "This identifier is already registered."}
            )

        # ---- Phone uniqueness ----
        phone = data.get("phone")
        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                {"phone": "This phone number is already registered."}
            )

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )
        return user


# =====================================================
# LOGIN SERIALIZER (UNCHANGED, SAFE)
# =====================================================
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username") or data.get("email")
        password = data.get("password")

        if not username or not password:
            raise serializers.ValidationError(
                "Username/email and password required."
            )

        # Try default authentication
        user = authenticate(username=username, password=password)

        # Fallback: authenticate via email
        if not user:
            user_qs = User.objects.filter(email__iexact=username).first()
            if user_qs and user_qs.check_password(password):
                user = user_qs

        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        data["user"] = user
        return data


# =====================================================
# MEMBER LOG SERIALIZER
# =====================================================
class MemberLogSerializer(serializers.ModelSerializer):
    performed_by = serializers.SerializerMethodField()

    class Meta:
        model = MemberLog
        fields = [
            "id",
            "action",
            "member_username",
            "member_email",
            "member_role",
            "performed_by",
            "timestamp",
        ]

    def get_performed_by(self, obj):
        return obj.performed_by.username if obj.performed_by else "-"

# =====================================================
# PASSWORD RESET SERIALIZERS (UNCHANGED)
# =====================================================
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)


# =====================================================
# PROFILE IMAGE UPLOAD
# =====================================================
class ProfileImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["profile_image"]


# =====================================================
# PASSWORD CHANGE
# =====================================================
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
    )
