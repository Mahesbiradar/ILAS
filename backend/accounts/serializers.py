# backend/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MemberLog, PasswordResetOTP
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone",
            "unique_id",
            "department",
            "year",
            "designation",
            "is_logged_in",
            "is_verified",
            "date_joined",
        ]
        read_only_fields = ["id", "is_logged_in", "is_verified", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={"input_type": "password"})
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "role",
            "phone",
            "unique_id",
            "department",
            "year",
            "designation",
        ]

    def validate(self, data):
        # confirm password if provided
        if data.get("confirm_password"):
            if data["password"] != data["confirm_password"]:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        # unique email/unique_id checks
        email = data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        unique_id = data.get("unique_id")
        if unique_id and User.objects.filter(unique_id__iexact=unique_id).exists():
            raise serializers.ValidationError({"unique_id": "This identifier is already registered."})

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        # create user with hashed password
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username") or data.get("email")
        password = data.get("password")
        if not username or not password:
            raise serializers.ValidationError("Username/email and password required.")

        # first try standard authenticate
        user = authenticate(username=username, password=password)
        if not user:
            # try by email (case-insensitive)
            user_qs = User.objects.filter(email__iexact=username).first()
            if user_qs and user_qs.check_password(password):
                user = user_qs
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        data["user"] = user
        return data


class MemberLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLog
        fields = "__all__"


# Password Reset serializers
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)


# backend/accounts/serializers.py
from django.contrib.auth.password_validation import validate_password

class ProfileImageSerializer(serializers.ModelSerializer):
    """Used for uploading profile images."""
    class Meta:
        model = User
        fields = ["profile_image"]

class PasswordChangeSerializer(serializers.Serializer):
    """Used for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
