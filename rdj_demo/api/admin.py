from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from api.models import User, Theme, Motion, Round, RoundAllocation, AdjudicatorRating, SpeakerScore
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email')

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'is_active', 
                 'is_staff', 'is_superuser', 'is_admin', 'is_debater', 'is_adjudicator')

class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    # Make sure to include your custom fields
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_admin', 'is_debater', 'is_adjudicator')
    list_filter = ('is_staff', 'is_superuser', 'is_admin', 'is_debater', 'is_adjudicator')
    
    # Add your custom fields to fieldsets
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Debate Roles', {'fields': ('is_admin', 'is_debater', 'is_adjudicator')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Make sure add_fieldsets is properly defined for the user creation form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    # Ensure passwords get properly hashed
    def save_model(self, request, obj, form, change):
        if obj.password and not obj.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

# Unregister the default User admin if it exists
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

# Register your custom User model with the admin site
admin.site.register(User, CustomUserAdmin)
admin.site.register(Theme)
admin.site.register(Motion)
admin.site.register(Round)
admin.site.register(RoundAllocation)
admin.site.register(AdjudicatorRating)
admin.site.register(SpeakerScore)