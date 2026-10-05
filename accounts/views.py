from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer,
    MyTokenObtainPairSerializer
)

from .permissions import (
    IsServiceProvider,
    IsCustomer
)


class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer


class MyTokenObtainPairView(TokenObtainPairView):

    serializer_class = MyTokenObtainPairSerializer


class ProtectedView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response({
            'message': 'You are authenticated',
            'username': request.user.username
        })


class ProviderOnlyView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsServiceProvider
    ]

    def get(self, request):

        return Response({
            'message': 'You are a Service Provider',
            'username': request.user.username,
            'role': request.user.account.role
        })


class CustomerOnlyView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsCustomer
    ]

    def get(self, request):

        return Response({
            'message': 'You are a Customer',
            'username': request.user.username,
            'role': request.user.account.role
        })