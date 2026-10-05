from rest_framework import serializers

from .models import (
    ServiceProvider,
    Service,
    Booking,
    BookingMessage,
    BookingCancellationRequest,
    ContactMessage,
)


class ServiceProviderSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ServiceProvider

        fields = '__all__'
        read_only_fields = [
            'user',
            'is_verified',
            'created_at',
        ]


class ServiceSerializer(
    serializers.ModelSerializer
):

    provider_name = serializers.SerializerMethodField()
    provider_experience = serializers.SerializerMethodField()
    provider_verified = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Service

        fields = [
            'id',
            'provider',
            'name',
            'description',
            'price',
            'is_available',
            'image',
            'provider_name',
            'provider_experience',
            'provider_verified',
            'created_at',
            'is_deleted',
            'deleted_at',
        ]
        read_only_fields = [
            'provider_name',
            'provider_experience',
            'provider_verified',
            'created_at',
            'is_deleted',
            'deleted_at',
        ]

    def get_provider_name(self, instance):
        if instance.provider is None:
            return None

        return (
            instance.provider.business_name
            or instance.provider.user.get_full_name()
            or instance.provider.user.username
        )

    def get_provider_experience(self, instance):
        if instance.provider is None:
            return None

        return instance.provider.experience

    def get_provider_verified(self, instance):
        if instance.provider is None:
            return False

        return instance.provider.is_verified

    def get_is_deleted(self, instance):
        return instance.deleted_at is not None


class BookingSerializer(
    serializers.ModelSerializer
):

    service_name = serializers.CharField(
        source='service.name',
        read_only=True,
    )
    provider_name = serializers.SerializerMethodField(    )
    customer_name = serializers.SerializerMethodField()
    cancellation_request = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'service',
            'service_name',
            'provider_name',
            'customer_name',
            'booking_date',
            'booking_time',
            'address',
            'notes',
            'status',
            'confirmed_at',
            'cancellation_reason',
            'cancelled_by',
            'completed_at',
            'completed_price',
            'created_at',
            'cancellation_request',
        ]

        read_only_fields = [
            'user',
            'service_name',
            'provider_name',
            'customer_name',
            'confirmed_at',
            'cancellation_reason',
            'cancelled_by',
            'created_at',
            'completed_at',
            'completed_price',
        ]

    def get_provider_name(self, instance):
        provider = instance.service.provider

        if provider is None:
            return 'Independent Provider'

        return (
            provider.business_name
            or provider.user.get_full_name()
            or provider.user.username
        )

    def get_customer_name(self, instance):
        return (
            instance.user.get_full_name()
            or instance.user.username
        )

    def get_cancellation_request(self, instance):
        cancellation_request = next(
            iter(instance.cancellation_requests.all()),
            None,
        )
        if cancellation_request is None:
            return None

        return BookingCancellationRequestSerializer(
            cancellation_request
        ).data


class BookingCancellationRequestSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = BookingCancellationRequest
        fields = [
            'id',
            'reason',
            'status',
            'provider_response',
            'requested_at',
            'provider_read_at',
            'decided_at',
        ]
        read_only_fields = fields


class BookingMessageSerializer(
    serializers.ModelSerializer
):

    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    delivery_status = serializers.SerializerMethodField()

    class Meta:
        model = BookingMessage
        fields = [
            'id',
            'booking',
            'sender',
            'sender_name',
            'sender_role',
            'message',
            'created_at',
            'delivered_at',
            'read_at',
            'delivery_status',
        ]
        read_only_fields = [
            'id',
            'booking',
            'sender',
            'sender_name',
            'sender_role',
            'created_at',
            'delivered_at',
            'read_at',
            'delivery_status',
        ]

    def validate_message(self, value):
        message = value.strip()
        if not message:
            raise serializers.ValidationError(
                'Message cannot be empty.'
            )
        return message

    def get_sender_name(self, instance):
        return (
            instance.sender.get_full_name()
            or instance.sender.username
        )

    def get_sender_role(self, instance):
        account = getattr(instance.sender, 'account', None)
        return account.role if account else ''

    def get_delivery_status(self, instance):
        if instance.read_at is not None:
            return 'read'
        if instance.delivered_at is not None:
            return 'delivered'
        return 'sent'


class ContactMessageSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ContactMessage
        fields = [
            'id',
            'name',
            'email',
            'topic',
            'message',
            'status',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'created_at',
        ]