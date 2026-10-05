from django.conf import settings
from django.db import models

# Create your models here.
# accounts model
class Account(models.Model):

    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
    ]

    user = models.OneToOneField('auth.User', on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='customer'
    )
    last_seen_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.user.username


class ProviderLoginEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_login_events',
    )
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-logged_at']
        indexes = [
            models.Index(
                fields=['user', '-logged_at'],
                name='provider_login_user_date_idx',
            ),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.logged_at}'