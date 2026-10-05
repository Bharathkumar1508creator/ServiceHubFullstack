from datetime import timedelta

from django.db import transaction
from django.db.models import Count, OuterRef, Q, Subquery
from django.utils import timezone
from rest_framework import generics, viewsets
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser
)
from .models import (
    Service,
    ServiceProvider,
    Booking,
    BookingMessage,
    BookingCancellationRequest,
    ContactMessage,
)

from accounts.models import Account, ProviderLoginEvent
from accounts.serializers import ProviderLoginEventSerializer

from .serializers import (
    ServiceProviderSerializer,
    ServiceSerializer,
    BookingSerializer,
    BookingMessageSerializer,
    BookingCancellationRequestSerializer,
    ContactMessageSerializer,
)

from accounts.permissions import (
    IsServiceProvider,
    IsCustomer
)


class ContactMessageCreateView(
    generics.CreateAPIView
):

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]


class ServiceProviderViewSet(
    viewsets.ModelViewSet
):

    queryset = ServiceProvider.objects.all()

    serializer_class = ServiceProviderSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    def get_permissions(self):

        if self.action == 'login_history':
            return [
                IsAuthenticated(),
                IsServiceProvider(),
            ]

        if self.action in [
            'list',
            'retrieve'
        ]:
            return [AllowAny()]

        return [
            IsAuthenticated(),
            IsServiceProvider()
        ]

    def get_queryset(self):

        user = self.request.user

        if not user.is_authenticated:
            return ServiceProvider.objects.all()

        if (
            hasattr(user, 'account')
            and user.account.role == 'provider'
        ):
            return ServiceProvider.objects.filter(
                user=user
            )

        return ServiceProvider.objects.all()

    def perform_create(self, serializer):

        user = self.request.user

        if ServiceProvider.objects.filter(
            user=user
        ).exists():

            raise PermissionDenied(
                'Service provider profile already exists.'
            )

        serializer.save(
            user=user
        )

    def perform_update(self, serializer):

        provider = serializer.instance

        if provider.user != self.request.user:

            raise PermissionDenied(
                'You can only update your own profile.'
            )

        serializer.save(
            user=provider.user
        )

    def perform_destroy(self, instance):

        if instance.user != self.request.user:

            raise PermissionDenied(
                'You can only delete your own profile.'
            )

        raise PermissionDenied(
            'Service provider profile deletion is not allowed.'
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='login-history',
    )
    def login_history(self, request):
        events = ProviderLoginEvent.objects.filter(
            user=request.user
        )[:100]
        return Response(
            ProviderLoginEventSerializer(
                events,
                many=True,
            ).data
        )


class ServiceViewSet(
    viewsets.ModelViewSet
):

    queryset = Service.objects.select_related(
        'provider',
        'provider__user',
    )

    serializer_class = ServiceSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    def get_permissions(self):

        if self.action in [
            'list',
            'retrieve'
        ]:
            return [AllowAny()]

        return [
            IsAuthenticated(),
            IsServiceProvider()
        ]

    def get_queryset(self):

        user = self.request.user

        if not user.is_authenticated:
            return self.queryset.filter(
                deleted_at__isnull=True
            )

        if (
            hasattr(user, 'account')
            and user.account.role == 'provider'
        ):
            return self.queryset.filter(
                provider__user=user
            )

        return self.queryset.filter(
            deleted_at__isnull=True
        )

    def perform_create(self, serializer):

        user = self.request.user

        if not hasattr(
            user,
            'service_provider'
        ):

            raise PermissionDenied(
                'Service provider profile does not exist.'
            )

        provider = user.service_provider

        serializer.save(
            provider=provider
        )

    def perform_update(self, serializer):
        service = serializer.instance

        if (
            service.provider is None
            or service.provider.user != self.request.user
        ):

            raise PermissionDenied(
                'You can only update your own services.'
            )

        if service.deleted_at is not None:
            raise PermissionDenied(
                'Deleted services cannot be updated.'
            )

        serializer.save(
            provider=service.provider
        )

    def perform_destroy(self, instance):

        if (
            instance.provider is None
            or instance.provider.user != self.request.user
        ):

            raise PermissionDenied(
                'You can only delete your own services.'
            )

        if instance.deleted_at is None:
            instance.deleted_at = timezone.now()
            instance.is_available = False
            instance.save(
                update_fields=['deleted_at', 'is_available']
            )

class BookingViewSet(
    viewsets.ModelViewSet
):

    serializer_class = BookingSerializer
    http_method_names = [
        'get',
        'post',
        'head',
        'options',
    ]

    def get_permissions(self):

        if self.action == 'create':

            return [
                IsAuthenticated(),
                IsCustomer()
            ]

        if self.action == 'cancel':

            return [
                IsAuthenticated(),
                IsCustomer()
            ]

        if self.action == 'request_cancellation':
            return [
                IsAuthenticated(),
                IsCustomer(),
            ]

        if self.action == 'cancellation_request':
            return [
                IsAuthenticated(),
                IsServiceProvider(),
            ]

        if self.action == 'respond':

            return [
                IsAuthenticated(),
                IsServiceProvider()
            ]

        return [
            IsAuthenticated()
        ]

    def get_queryset(self):

        user = self.request.user

        if (
            hasattr(user, 'account')
            and user.account.role == 'provider'
        ):

            return Booking.objects.select_related(
                'service',
                'service__provider',
                'service__provider__user',
                'user',
            ).prefetch_related(
                'cancellation_requests__message',
            ).filter(
                service__provider__user=user
            )

        return Booking.objects.select_related(
            'service',
            'service__provider',
            'service__provider__user',
            'user',
        ).prefetch_related(
            'cancellation_requests__message',
        ).filter(
            user=user
        )

    @staticmethod
    def user_is_online(user):
        if user is None:
            return False

        cutoff = timezone.now() - timedelta(seconds=45)
        return Account.objects.filter(
            user=user,
            last_seen_at__gte=cutoff,
        ).exists()

    @action(
        detail=False,
        methods=['post'],
        url_path='presence',
    )
    def presence(self, request):
        try:
            account = request.user.account
        except Account.DoesNotExist as error:
            raise PermissionDenied(
                'An account profile is required for chat presence.'
            ) from error

        account.last_seen_at = timezone.now()
        account.save(update_fields=['last_seen_at'])
        return Response({
            'is_online': True,
            'last_seen_at': account.last_seen_at,
        })

    @action(
        detail=False,
        methods=['get'],
        url_path='notifications',
    )
    def notifications(self, request):
        unread_messages = list(
            BookingMessage.objects.filter(
                booking__in=self.get_queryset(),
                read_at__isnull=True,
            ).exclude(
                sender=request.user,
            ).select_related(
                'sender',
                'sender__account',
                'booking__service',
            ).order_by(
                '-created_at',
                '-id',
            )[:30]
        )

        if unread_messages:
            delivered_at = timezone.now()
            BookingMessage.objects.filter(
                id__in=[
                    message.id
                    for message in unread_messages
                ],
                delivered_at__isnull=True,
            ).update(delivered_at=delivered_at)
            for message in unread_messages:
                if message.delivered_at is None:
                    message.delivered_at = delivered_at

        notifications = []
        for message in unread_messages:
            notification = dict(
                BookingMessageSerializer(message).data
            )
            notification['service_name'] = (
                message.booking.service.name
            )
            notifications.append(notification)

        return Response(notifications)

    @action(
        detail=False,
        methods=['get'],
        url_path='conversations',
    )
    def conversations(self, request):
        latest_message_id = BookingMessage.objects.filter(
            booking_id=OuterRef('pk'),
        ).order_by(
            '-created_at',
            '-id',
        ).values(
            'id',
        )[:1]
        latest_message_at = BookingMessage.objects.filter(
            booking_id=OuterRef('pk'),
        ).order_by(
            '-created_at',
            '-id',
        ).values(
            'created_at',
        )[:1]

        bookings = self.get_queryset().filter(
            messages__isnull=False,
        ).select_related(
            'user',
            'service',
            'service__provider',
            'service__provider__user',
        ).annotate(
            latest_message_id=Subquery(latest_message_id),
            latest_message_at=Subquery(latest_message_at),
            unread_count=Count(
                'messages',
                filter=Q(messages__read_at__isnull=True)
                & ~Q(messages__sender=request.user),
            ),
        ).distinct().order_by(
            '-latest_message_at',
            '-id',
        )[:100]

        latest_messages = BookingMessage.objects.filter(
            id__in=[
                booking.latest_message_id
                for booking in bookings
            ]
        ).select_related(
            'sender',
        ).in_bulk()

        is_provider = (
            getattr(
                getattr(request.user, 'account', None),
                'role',
                None,
            )
            == 'provider'
        )
        conversations = []
        for booking in bookings:
            latest_message = latest_messages.get(
                booking.latest_message_id
            )
            if latest_message is None:
                continue

            if is_provider:
                other_party = booking.user
                other_party_name = (
                    other_party.get_full_name()
                    or other_party.username
                )
            elif booking.service.provider_id is not None:
                service_provider = booking.service.provider
                other_party = service_provider.user
                other_party_name = (
                    service_provider.business_name
                    or other_party.get_full_name()
                    or other_party.username
                )
            else:
                other_party = None
                other_party_name = 'Independent Provider'
            conversations.append({
                'booking_id': booking.id,
                'service_name': booking.service.name,
                'booking_status': booking.status,
                'other_party_name': other_party_name,
                'other_party_online': self.user_is_online(
                    other_party
                ),
                'latest_message': latest_message.message,
                'latest_message_sender_id': latest_message.sender_id,
                'latest_message_is_mine': (
                    latest_message.sender_id == request.user.id
                ),
                'latest_message_sender_name': (
                    latest_message.sender.get_full_name()
                    or latest_message.sender.username
                ),
                'latest_message_at': latest_message.created_at,
                'unread_count': booking.unread_count,
            })

        return Response(conversations)

    def perform_create(self, serializer):

        if (
            self.request.user.account.role
            != 'customer'
        ):

            raise PermissionDenied(
                'Only customers can create bookings.'
            )

        service = serializer.validated_data[
            'service'
        ]

        if (
            service.deleted_at is not None
            or not service.is_available
        ):

            raise PermissionDenied(
                'This service is currently unavailable.'
            )

        serializer.save(
            user=self.request.user,
            status='pending'
        )

    @action(
        detail=True,
        methods=['post']
    )
    def respond(
        self,
        request,
        pk=None
    ):

        booking = self.get_object()
        requested_status = request.data.get('status')
        cancellation_reason = str(
            request.data.get('cancellation_reason', '')
        ).strip()

        allowed_transitions = {
            'pending': {'confirmed', 'cancelled'},
            'confirmed': {'completed', 'cancelled'},
        }

        if requested_status not in allowed_transitions.get(
            booking.status,
            set()
        ):
            raise PermissionDenied(
                'This booking cannot be moved to that status.'
            )

        if requested_status == 'cancelled':
            if len(cancellation_reason) < 5:
                raise ValidationError({
                    'cancellation_reason':
                        'Please provide a reason of at least 5 characters.'
                })

            if len(cancellation_reason) > 500:
                raise ValidationError({
                    'cancellation_reason':
                        'The reason must be 500 characters or fewer.'
                })

            booking.cancellation_reason = cancellation_reason
            booking.cancelled_by = 'provider'

        booking.status = requested_status
        update_fields = ['status']

        if requested_status == 'confirmed':
            booking.confirmed_at = timezone.now()
            update_fields.append('confirmed_at')

        if requested_status == 'cancelled':
            update_fields.extend([
                'cancellation_reason',
                'cancelled_by',
            ])

        if requested_status == 'completed':
            booking.completed_at = timezone.now()
            update_fields.append('completed_at')
            booking.completed_price = booking.service.price
            update_fields.append('completed_price')

        booking.save(update_fields=update_fields)

        return Response(
            BookingSerializer(booking).data
        )

    @action(
        detail=True,
        methods=['post']
    )
    def cancel(
        self,
        request,
        pk=None
    ):

        booking = self.get_object()

        if booking.status == 'completed':

            raise PermissionDenied(
                'Completed bookings cannot be cancelled.'
            )

        if booking.status != 'pending':
            raise PermissionDenied(
                'Once a provider accepts, request cancellation and wait for their approval.'
            )

        if booking.status == 'cancelled':

            raise PermissionDenied(
                'Booking is already cancelled.'
            )

        booking.status = 'cancelled'
        booking.cancelled_by = 'customer'

        booking.save(
            update_fields=['status', 'cancelled_by']
        )

        return Response({
            'message':
                'Booking cancelled successfully.',
            'booking_id':
                booking.id,
            'status':
                booking.status
        })

    @action(
        detail=True,
        methods=['post'],
        url_path='request-cancellation',
    )
    @transaction.atomic
    def request_cancellation(
        self,
        request,
        pk=None,
    ):
        booking = self.get_object()
        booking = Booking.objects.select_for_update().get(
            pk=booking.pk
        )
        if booking.status != 'confirmed':
            raise PermissionDenied(
                'A cancellation request is available after the provider accepts the booking.'
            )

        reason = str(request.data.get('reason', '')).strip()
        if len(reason) < 5:
            raise ValidationError({
                'reason': 'Please provide a reason of at least 5 characters.'
            })
        if len(reason) > 500:
            raise ValidationError({
                'reason': 'The reason must be 500 characters or fewer.'
            })

        if booking.cancellation_requests.filter(
            status='pending',
        ).exists():
            raise PermissionDenied(
                'A cancellation request is already waiting for the provider.'
            )

        provider = booking.service.provider
        provider_user = (
            provider.user if provider is not None else None
        )
        if provider_user is None:
            raise PermissionDenied(
                'This booking has no assigned provider to approve cancellation.'
            )

        message_text = (
            f'Cancellation request for booking #{booking.id}: {reason}'
        )
        message = BookingMessage.objects.create(
            booking=booking,
            sender=request.user,
            message=message_text,
            delivered_at=(
                timezone.now()
                if self.user_is_online(provider_user)
                else None
            ),
        )
        cancellation_request = BookingCancellationRequest.objects.create(
            booking=booking,
            message=message,
            reason=reason,
        )

        response_data = BookingSerializer(booking).data
        response_data['cancellation_request'] = (
            BookingCancellationRequestSerializer(
                cancellation_request
            ).data
        )
        return Response(response_data, status=201)

    @action(
        detail=True,
        methods=['get', 'post'],
        url_path='cancellation-request',
    )
    @transaction.atomic
    def cancellation_request(
        self,
        request,
        pk=None,
    ):
        booking = self.get_object()
        booking = Booking.objects.select_for_update().get(
            pk=booking.pk
        )
        cancellation_request = (
            BookingCancellationRequest.objects.select_for_update().filter(
                booking=booking,
            ).first()
        )
        if cancellation_request is None:
            raise PermissionDenied(
                'There is no cancellation request for this booking.'
            )

        if request.method == 'GET':
            if cancellation_request.status != 'pending':
                raise PermissionDenied(
                    'This cancellation request no longer needs review.'
                )
            if cancellation_request.provider_read_at is None:
                cancellation_request.provider_read_at = timezone.now()
                cancellation_request.save(
                    update_fields=['provider_read_at']
                )
            BookingMessage.objects.filter(
                pk=cancellation_request.message_id,
                read_at__isnull=True,
            ).update(
                delivered_at=timezone.now(),
                read_at=timezone.now(),
            )
            return Response(
                BookingCancellationRequestSerializer(
                    cancellation_request
                ).data
            )

        if cancellation_request.status != 'pending':
            raise PermissionDenied(
                'This cancellation request has already been decided.'
            )
        if booking.status != 'confirmed':
            raise PermissionDenied(
                'This booking is no longer awaiting cancellation approval.'
            )
        if cancellation_request.provider_read_at is None:
            raise PermissionDenied(
                'Read the customer’s cancellation reason before deciding.'
            )

        decision = request.data.get('decision')
        if decision not in {'approved', 'rejected'}:
            raise ValidationError({
                'decision': 'Choose approved or rejected.'
            })

        provider_response = str(
            request.data.get('provider_response', '')
        ).strip()
        if len(provider_response) > 500:
            raise ValidationError({
                'provider_response':
                    'The response must be 500 characters or fewer.'
            })

        now = timezone.now()
        cancellation_request.status = decision
        cancellation_request.provider_response = provider_response
        cancellation_request.decided_at = now
        cancellation_request.save(update_fields=[
            'status',
            'provider_response',
            'decided_at',
        ])

        if decision == 'approved':
            booking.status = 'cancelled'
            booking.cancelled_by = 'customer'
            booking.cancellation_reason = cancellation_request.reason
            booking.save(update_fields=[
                'status',
                'cancelled_by',
                'cancellation_reason',
            ])
            provider_message = (
                'Your cancellation request was approved. '
                'This booking has been cancelled.'
            )
        else:
            provider_message = (
                'Your cancellation request was not approved. '
                'The booking remains confirmed.'
            )
            if provider_response:
                provider_message += f' Provider note: {provider_response}'

        BookingMessage.objects.create(
            booking=booking,
            sender=request.user,
            message=provider_message,
        )

        response_data = BookingSerializer(booking).data
        response_data['cancellation_request'] = (
            BookingCancellationRequestSerializer(
                cancellation_request
            ).data
        )
        return Response(response_data)

    def perform_destroy(self, instance):

        raise PermissionDenied(
            'Booking deletion is not allowed.'
        )

    @action(
        detail=True,
        methods=['get', 'post'],
        url_path='messages',
    )
    def messages(self, request, pk=None):
        booking = self.get_object()
        message_queryset = BookingMessage.objects.filter(
            booking=booking
        ).select_related(
            'sender',
            'sender__account',
        )

        if request.method == 'GET':
            message_queryset.filter(
                read_at__isnull=True,
            ).exclude(
                sender=request.user,
            ).update(
                delivered_at=timezone.now(),
                read_at=timezone.now(),
            )
            serializer = BookingMessageSerializer(
                message_queryset,
                many=True,
            )
            return Response(serializer.data)

        serializer = BookingMessageSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        recipient = (
            booking.service.provider.user
            if booking.service.provider_id is not None
            and request.user.id == booking.user_id
            else booking.user
        )
        delivered_at = (
            timezone.now()
            if self.user_is_online(recipient)
            else None
        )
        message = serializer.save(
            booking=booking,
            sender=request.user,
            delivered_at=delivered_at,
        )
        return Response(
            BookingMessageSerializer(message).data,
            status=201,
        )

    @action(
        detail=True,
        methods=['get'],
        url_path='presence',
    )
    def booking_presence(self, request, pk=None):
        booking = self.get_object()
        if request.user.id == booking.user_id:
            partner = (
                booking.service.provider.user
                if booking.service.provider_id is not None
                else None
            )
        else:
            partner = booking.user

        last_seen_at = None
        if partner is not None:
            account = Account.objects.filter(
                user=partner,
            ).only(
                'last_seen_at',
            ).first()
            if account is not None:
                last_seen_at = account.last_seen_at

        return Response({
            'is_online': self.user_is_online(partner),
            'last_seen_at': last_seen_at,
        })