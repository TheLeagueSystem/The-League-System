from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
from rest_framework.authtoken.models import Token as DefaultTokenModel

# Custom User Model
class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_debater = models.BooleanField(default=False)
    is_adjudicator = models.BooleanField(default=False)

    # Prevent conflicts with Django's default User model
    groups = models.ManyToManyField(Group, related_name="api_users", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="api_users_permissions", blank=True)

    def save(self, *args, **kwargs):
        # Sync is_admin with is_staff for Django admin compatibility
        if self.is_admin and not self.is_staff:
            self.is_staff = True
        # You may want to uncomment this if you want them fully synchronized both ways
        # elif not self.is_admin and self.is_staff:
        #     self.is_staff = False
        super().save(*args, **kwargs)

    def promote_to_admin(self):
        self.is_admin = True
        self.is_staff = True  # Grant access to Django admin
        self.save()

    def demote_from_admin(self):
        self.is_admin = False
        self.is_staff = False  # Remove access to Django admin
        self.save()
    
    # Rest of your model remains unchanged

# Update the Token model definition if needed
class Token(DefaultTokenModel):
    class Meta:
        proxy = True
        
    @classmethod
    def get_or_create(cls, user):
        token, created = cls.objects.get_or_create(user=user)
        return token, created

# Define Theme BEFORE Motion since Motion references it
class Theme(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)  # Make sure this line exists
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

# Motion Model - now Theme is defined before it's referenced
class Motion(models.Model):
    COMPETITION_CHOICES = [
        ('General', 'General'),
        ('WUDC', 'World Universities Debating Championship'),
        ('PDA', 'Public Display of Abby'),
        ('AIDA', 'Asian Intervarsity Debating Association'),
        ('ABP', 'Asian British Parliamentary'),
    ]
    
    # Remove the db_column parameter to use Django's default column name
    theme = models.ForeignKey(
        Theme, 
        on_delete=models.CASCADE,
        related_name='motions'
    )
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    competition_type = models.CharField(
        max_length=100, 
        choices=COMPETITION_CHOICES,
        default='General'
    )
    
    def __str__(self):
        return f"{self.theme}: {self.text[:30]}"
    
    class Meta:
        db_table = 'api_motion'

# Debate Round
class Round(models.Model):
    """Model for debate rounds."""
    FORMAT_CHOICES = [
        ('ABP', 'British Parliamentary'),
        ('PDA', 'Asian Parliamentary'),
    ]
    
    STATUS_CHOICES = [
        ('SETUP', 'Setup'),
        ('ALLOCATION', 'Allocation'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('TERMINATED', 'Terminated'),
    ]
    
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    motion = models.ForeignKey(Motion, on_delete=models.CASCADE, null=True, blank=True)
    max_adjudicators = models.PositiveIntegerField(default=3)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='SETUP')
    created_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rounds', default=1)
    
    # Round code fields - make sure these exist
    round_code = models.CharField(max_length=6, unique=True, null=True, blank=True) 
    is_active = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        # Generate a unique round code if one doesn't exist
        if not self.round_code:
            self.round_code = self._generate_unique_code()
        super().save(*args, **kwargs)
    
    def _generate_unique_code(self):
        import random
        import string
        
        # Generate a 6-character alphanumeric code
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
            # Check if this code already exists
            if not Round.objects.filter(round_code=code).exists():
                return code
    
    def __str__(self):
        return f"{self.get_format_display()} Round {self.id} - {self.status}"
    
    def start_round(self):
        if self.status == 'ALLOCATION':
            self.status = 'ACTIVE'
            self.is_active = True
            self.started_at = timezone.now()
            self.save()
            
    def complete_round(self):
        if self.status == 'ACTIVE':
            self.status = 'COMPLETED'
            self.is_active = False
            self.completed_at = timezone.now()
            self.save()
    
    def terminate_round(self):
        """Force terminate an active round."""
        if self.status == 'ACTIVE':
            self.status = 'TERMINATED'
            self.is_active = False
            self.completed_at = timezone.now()
            self.save()
    
    @property
    def required_debaters(self):
        """Returns the number of debaters required based on format."""
        return 8 if self.format == 'ABP' else 6

class RoundAllocation(models.Model):
    ROLE_CHOICES = [
        # Debater roles - British Parliamentary
        ('Prime Minister', 'Prime Minister'),
        ('Deputy Prime Minister', 'Deputy Prime Minister'),
        ('Member of Government', 'Member of Government'),
        ('Government Whip', 'Government Whip'),
        ('Leader of Opposition', 'Leader of Opposition'),
        ('Deputy Leader of Opposition', 'Deputy Leader of Opposition'),
        ('Member of Opposition', 'Member of Opposition'),
        ('Opposition Whip', 'Opposition Whip'),
        
        # Adjudicator roles
        ('Chair Adjudicator', 'Chair Adjudicator'),
        ('Panelist', 'Panelist'),
        ('Trainee', 'Trainee'),
        
        # Spectator role
        ('Spectator', 'Spectator'),
    ]
    
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='allocations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='round_allocations')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    
    class Meta:
        unique_together = ('round', 'user')
        
    def __str__(self):
        return f"{self.user.username} as {self.role} in Round {self.round.id}"

# Ratings
class AdjudicatorRating(models.Model):
    round = models.ForeignKey(Round, on_delete=models.CASCADE)
    adjudicator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rated_adjudicator")
    rated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rater")
    score = models.PositiveIntegerField()

class RoundResult(models.Model):
    """Model for storing debate round results submitted by chair adjudicator."""
    round = models.OneToOneField(Round, on_delete=models.CASCADE, related_name='result')
    winning_side = models.CharField(max_length=20, choices=[
        ('GOVERNMENT', 'Government'),
        ('OPPOSITION', 'Opposition'),
    ])
    summary = models.TextField()  # Chair's summary and feedback for the round
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='submitted_results')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Result for Round {self.round.id}"

class SpeakerScore(models.Model):
    """Model for storing individual speaker scores."""
    result = models.ForeignKey(RoundResult, on_delete=models.CASCADE, related_name='speaker_scores', null=True)  # Add null=True here
    allocation = models.ForeignKey(RoundAllocation, on_delete=models.CASCADE, null=True)  # Already modified with null=True
    score = models.DecimalField(max_digits=4, decimal_places=1)  # e.g. 85.5
    comments = models.TextField(blank=True)
    
    class Meta:
        # If you have this constraint, you might want to modify it since both fields can be null now
        # unique_together = ('result', 'allocation')
        constraints = [
            models.UniqueConstraint(
                fields=['result', 'allocation'],
                condition=models.Q(result__isnull=False, allocation__isnull=False),
                name='unique_result_allocation'
            )
        ]
    
    def __str__(self):
        return f"Score for {self.allocation.user.username if self.allocation else 'Unknown'} in Round {self.allocation.round.id if self.allocation else 'Unknown'}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('ROUND_START', 'Round Starting'),
        ('ROUND_END', 'Round Ended'),
        ('ROLE_ASSIGNED', 'Role Assigned'),
        ('RESULTS_AVAILABLE', 'Results Available'),
        ('SYSTEM', 'System Notification'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    link = models.CharField(max_length=255, null=True, blank=True)  # URL to navigate to when notification is clicked
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type}: {self.message[:30]}..."

# Add this model to your existing models

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='activity_logs')
    role = models.CharField(max_length=50)
    action = models.CharField(max_length=20, choices=[
        ('joined', 'Joined Round'),
        ('allocated', 'Allocated'),
        ('completed', 'Completed Round'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - Round {self.round.id}"
