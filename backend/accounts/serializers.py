from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


# 🔹 USER SERIALIZER
class UserSerializer(serializers.ModelSerializer):
    """
    Used for returning user details (read-only).
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'usn']
        read_only_fields = ['id']


# 🔹 REGISTER SERIALIZER
class RegisterSerializer(serializers.ModelSerializer):
    """
    Used for user registration with password hashing.
    """
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'role', 'phone', 'usn']

    def validate(self, data):
        # Ensure both passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')  # remove confirm password
        password = validated_data.pop('password')

        # Create user using built-in method for hashing
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
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
