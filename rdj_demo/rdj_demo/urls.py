from django.contrib import admin
from django.urls import path, include
from api.views.auth_views import login_view

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin panel
    path('api/', include('api.urls')),  # Include API routes
    path('login/', login_view, name='login'),  # Direct login route
]