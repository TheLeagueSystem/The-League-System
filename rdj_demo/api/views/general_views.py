from django.shortcuts import render, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.views import View
from django.http import HttpResponseRedirect

class HomeView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponseRedirect("/api/login/")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Returns user-specific dashboard data."""
    return Response({"message": "Welcome to the User Dashboard!", "user": request.user.username})

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    """Returns admin-specific dashboard data."""
    return Response({"message": "Welcome to the Admin Dashboard!"})
