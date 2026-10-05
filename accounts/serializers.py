from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed

from .models import Account, ProviderLoginEvent

from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer
)


# ============================================================
# REGISTER SERIALIZER
# ============================================================

class RegisterSerializer(serializers.ModelSerializer):

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    address = serializers.CharField(
        required=False,
        allow_blank=True
    )

    role = serializers.ChoiceField(
        choices=Account.ROLE_CHOICES,
        default='customer',
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'first_name',
            'password',
            'phone_number',
            'address',
            'role'
        ]

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def validate_email(self, value):

        if value and User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                'A user with this email address already exists.'
            )

        return value

    def create(self, validated_data):

        phone_number = validated_data.pop(
            'phone_number',
            ''
        )

        address = validated_data.pop(
            'address',
            ''
        )

        role = validated_data.pop(
            'role',
            'customer'
        )

        password = validated_data.pop(
            'password'
        )

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        Account.objects.create(
            user=user,
            phone_number=phone_number,
            address=address,
            role=role
        )

        return user

    def to_representation(self, instance):

        return {
            'username': instance.username,
            'email': instance.email,
            'first_name': instance.first_name,
            'role': instance.account.role
        }


# ============================================================
# CUSTOM JWT LOGIN SERIALIZER
# ============================================================

class MyTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    def validate(self, attrs):

        attrs = attrs.copy()

        identifier = attrs.get(
            self.username_field
        )

        if identifier:

            email_matches = list(
                User.objects.filter(
                    email__iexact=identifier
                )[:2]
            )

            if len(email_matches) > 1:

                raise AuthenticationFailed(
                    'No active account found with the given credentials'
                )

            if email_matches:

                attrs[
                    self.username_field
                ] = email_matches[0].get_username()

        # Generate JWT tokens
        data = super().validate(attrs)

        if (
            hasattr(self.user, 'account')
            and self.user.account.role == 'provider'
        ):
            ProviderLoginEvent.objects.create(
                user=self.user
            )

        # Convert default token keys
        data['access_token'] = data.pop(
            'access'
        )

        data['refresh_token'] = data.pop(
            'refresh'
        )

        # User information
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'role': self.user.account.role
        }

        return data


class ProviderLoginEventSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ProviderLoginEvent
        fields = ['id', 'logged_at']
        read_only_fields = fields