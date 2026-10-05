from rest_framework.permissions import BasePermission


# ============================================================
# SERVICE PROVIDER PERMISSION
# ============================================================

class IsServiceProvider(BasePermission):

    def has_permission(self, request, view):

        # User login pannirukkaangala?
        if not request.user or not request.user.is_authenticated:
            return False

        # User role provider-aa?
        return request.user.account.role == 'provider'


# ============================================================
# CUSTOMER PERMISSION
# ============================================================

class IsCustomer(BasePermission):

    def has_permission(self, request, view):

        # User login pannirukkaangala?
        if not request.user or not request.user.is_authenticated:
            return False

        # User role customer-aa?
        return request.user.account.role == 'customer'