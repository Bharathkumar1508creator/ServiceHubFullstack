from django.contrib import admin

# Register your models here.
from .models import Account, ProviderLoginEvent

# registering models in python
admin.site.register(Account)
admin.site.register(ProviderLoginEvent)