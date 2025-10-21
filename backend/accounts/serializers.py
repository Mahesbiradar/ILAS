from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MemberLog


# 🔹 USER SERIALIZER
class UserSerializer(serializers.ModelSerializer):
    """
    Used for returning user details (read-only).
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'usn', 'is_logged_in']
        read_only_fields = ['id']


# 🔹 REGISTER SERIALIZER (updated)
class RegisterSerializer(serializers.ModelSerializer):
    """
    Used for user registration with password hashing.
    Works for both normal signup and admin-created members.
    """
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    confirm_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'role', 'phone', 'usn']

    def validate(self, data):
        """
        Allow confirm_password only if provided (for signup form),
        otherwise skip it (for admin-created members).
        """
        if 'confirm_password' in data and data['confirm_password']:
            if data['password'] != data['confirm_password']:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)  # safely remove if exists
        password = validated_data.pop('password')

        # Create user using Django's built-in hashing
        user = User.objects.create_user(password=password, **validated_data)
        return user


# 🔹 LOGIN SERIALIZER
class LoginSerializer(serializers.Serializer):
    """
    Handles user authentication.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data.get('username'), password=data.get('password'))
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        return user


# 🔹 MEMBER LOG SERIALIZER
class MemberLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLog
        fields = "__all__"
