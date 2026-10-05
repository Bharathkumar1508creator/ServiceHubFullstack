from django.urls import path, include

from rest_framework.routers import DefaultRouter

from .views import ContactMessageCreateView
from .chatbot import ChatbotAssistantView
from .views import (
    ServiceProviderViewSet,
    ServiceViewSet,
    BookingViewSet
)


router = DefaultRouter()


router.register(
    'service-providers',
    ServiceProviderViewSet,
    basename='service-provider'
)


router.register(
    'services',
    ServiceViewSet,
    basename='service'
)


router.register(
    'bookings',
    BookingViewSet,
    basename='booking'
)


urlpatterns = [
    path(
        'chatbot/',
        ChatbotAssistantView.as_view(),
        name='chatbot-assistant',
    ),
    path(
        'contact-messages/',
        ContactMessageCreateView.as_view(),
        name='contact-message-create',
    ),
    path(
        '',
        include(router.urls)
    ),
]