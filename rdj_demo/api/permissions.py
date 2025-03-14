from rest_framework.permissions import BasePermission

class IsStaffUser(BasePermission):
    """
    Custom permission to only allow staff users to access the view.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff