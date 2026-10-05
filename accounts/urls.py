from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    RegisterView,
    MyTokenObtainPairView,
    ProtectedView,
    ProviderOnlyView,
    CustomerOnlyView
)


urlpatterns = [

    # ========================================================
    # REGISTER
    # ========================================================

    path(
        'register/',
        RegisterView.as_view(),
        name='register'
    ),


    # ========================================================
    # LOGIN
    # ========================================================

    path(
        'login/',
        MyTokenObtainPairView.as_view(),
        name='login'
    ),

    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token-refresh'
    ),


    # ========================================================
    # PROTECTED
    # ========================================================

    path(
        'protected/',
        ProtectedView.as_view(),
        name='protected'
    ),


    # ========================================================
    # PROVIDER ONLY
    # ========================================================

    path(
        'provider-only/',
        ProviderOnlyView.as_view(),
        name='provider-only'
    ),


    # ========================================================
    # CUSTOMER ONLY
    # ========================================================

    path(
        'customer-only/',
        CustomerOnlyView.as_view(),
        name='customer-only'
    ),
]