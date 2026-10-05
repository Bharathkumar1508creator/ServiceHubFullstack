from django.db import models
from django.contrib.auth.models import User
import uuid


class ServiceProvider(models.Model):

    # Oru User-ku oru ServiceProvider profile mattum irukkum
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='service_provider'
    )

    # Service provider-oda business name
    business_name = models.CharField(
        max_length=150
    )

    # Business/service pathi additional details
    description = models.TextField(
        blank=True
    )

    # Provider contact number
    phone_number = models.CharField(
        max_length=20
    )

    # Provider service provide panra address
    address = models.TextField()

    # Provider-ku evlo years experience irukku
    experience = models.PositiveIntegerField()

    # Admin verify pannina provider-aa illaya
    is_verified = models.BooleanField(
        default=False
    )

    # Provider account create panna date/time
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.business_name


class Service(models.Model):

    # Indha service yaaroda service-nu connect pannrom
    # Oru provider multiple services create panna mudiyum
    provider = models.ForeignKey(
        ServiceProvider,
        on_delete=models.CASCADE,
        related_name='services',
        null=True,
        blank=True
    )

    # Service name
    name = models.CharField(
        max_length=100
    )

    # Service pathi full description
    description = models.TextField()

    # Service price
    price = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    # Service currently available-aa irukka?
    is_available = models.BooleanField(
        default=True
    )

    # Service image upload panna field
    image = models.ImageField(
        upload_to='services/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class Booking(models.Model):

    # Booking create panra customer/User
    # Oru User multiple bookings create panna mudiyum
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    # Customer book panra service
    # Oru service-ku multiple bookings irukkalam
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    # Customer service venum-nu select panra date
    booking_date = models.DateField()

    # Customer service venum-nu select panra time
    booking_time = models.TimeField()

    # Service provide panna vendiya location/address
    address = models.TextField()

    # Customer additional information kudukka optional field
    notes = models.TextField(
        blank=True
    )

    # Booking status-ku fixed values define pannrom
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    CANCELLATION_ACTOR_CHOICES = [
        ('customer', 'Customer'),
        ('provider', 'Provider'),
    ]

    # Booking current status
    # Default-aa every new booking Pending
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    cancellation_reason = models.TextField(
        blank=True,
        max_length=500,
    )
    cancelled_by = models.CharField(
        max_length=10,
        choices=CANCELLATION_ACTOR_CHOICES,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    completed_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Booking create aana date/time automatically save aagum
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.service.name}"


class BookingMessage(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='booking_messages',
    )
    message = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f'Booking #{self.booking_id} message by {self.sender.username}'


class BookingCancellationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='cancellation_requests',
    )
    message = models.OneToOneField(
        BookingMessage,
        on_delete=models.CASCADE,
        related_name='cancellation_request',
    )
    reason = models.TextField(max_length=500)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
    )
    provider_response = models.TextField(
        blank=True,
        max_length=500,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    provider_read_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    decided_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['-requested_at', '-id']

    def __str__(self):
        return (
            f'Booking #{self.booking_id} cancellation '
            f'{self.status}'
        )


class ContactMessage(models.Model):
    TOPIC_CHOICES = [
        ('Booking help', 'Booking help'),
        ('Provider account', 'Provider account'),
        ('Service listing', 'Service listing'),
        ('Something else', 'Something else'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In progress'),
        ('resolved', 'Resolved'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254)
    topic = models.CharField(
        max_length=50,
        choices=TOPIC_CHOICES,
        default='Booking help',
    )
    message = models.TextField(max_length=2000)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'contact message'
        verbose_name_plural = 'contact messages'

    def __str__(self):
        return f'{self.name} - {self.topic}'


class ChatbotInteraction(models.Model):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='chatbot_interactions',
        null=True,
        blank=True,
    )
    username = models.CharField(max_length=150)
    display_name = models.CharField(max_length=150)
    user_role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
    )
    session_id = models.UUIDField(
        default=uuid.uuid4,
        db_index=True,
    )
    question = models.TextField(max_length=2000)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        indexes = [
            models.Index(
                fields=['user_role', '-created_at'],
                name='chatbot_role_date_idx',
            ),
            models.Index(
                fields=['user', '-created_at'],
                name='chatbot_user_date_idx',
            ),
        ]

    def __str__(self):
        return f'{self.username} ({self.user_role}) - {self.created_at}'