from rest_framework import serializers
from .models import User, Motion, Theme, Round, RoundAllocation, ActivityLog  # Add Theme, Round, RoundAllocation import here

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_admin', 'is_debater', 'is_adjudicator']
        read_only_fields = ['id']
        
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

# Define ThemeSerializer BEFORE MotionSerializer since MotionSerializer uses it
class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ['id', 'name', 'description', 'created_at']

# Now define MotionSerializer after ThemeSerializer
class MotionSerializer(serializers.ModelSerializer):
    # Add nested theme serialization
    theme = ThemeSerializer(read_only=True)
    theme_id = serializers.PrimaryKeyRelatedField(
        queryset=Theme.objects.all(),
        source='theme',
        write_only=True
    )
    
    class Meta:
        model = Motion
        fields = ['id', 'theme', 'theme_id', 'text', 'created_at', 'competition_type']
        read_only_fields = ['id', 'created_at']

class RoundSerializer(serializers.ModelSerializer):
    motion_id = serializers.IntegerField(write_only=True)
    motion = serializers.SerializerMethodField()
    
    class Meta:
        model = Round
        fields = ['id', 'format', 'motion_id', 'motion', 'max_adjudicators', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
    
    def get_motion(self, obj):
        return {
            'id': obj.motion.id,
            'text': obj.motion.text,
            'theme': {
                'id': obj.motion.theme.id,
                'name': obj.motion.theme.name
            }
        }
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        round_obj = Round.objects.create(**validated_data)
        return round_obj

class RoundAllocationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = RoundAllocation
        fields = ['id', 'round', 'user', 'role', 'username', 'email']
        read_only_fields = ['id']

# Update your RoundDetailSerializer to handle missing motion
class RoundDetailSerializer(serializers.ModelSerializer):
    motion = serializers.SerializerMethodField()
    allocations = RoundAllocationSerializer(many=True, read_only=True)
    your_role = serializers.SerializerMethodField()
    format_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Round
        fields = ['id', 'format', 'format_display', 'motion', 'max_adjudicators', 
                 'status', 'created_at', 'started_at', 'allocations', 'your_role',
                 'round_code']
    
    def get_your_role(self, obj):
        # Add null checks for context and request
        if not self.context or 'request' not in self.context:
            return "Not Assigned"
            
        user = self.context['request'].user
        try:
            allocation = RoundAllocation.objects.filter(round=obj, user=user).first()
            return allocation.role if allocation and allocation.role else "Not Assigned"
        except Exception:
            return "Not Assigned"
    
    def get_format_display(self, obj):
        format_choices = {
            'ABP': 'British Parliamentary',
            'PDA': 'Asian Parliamentary'
        }
        return format_choices.get(obj.format, obj.format)
    
    def get_motion(self, obj):
        # Handle case where motion is null
        if not obj.motion:
            return None
            
        # Handle case where theme might be null
        theme_data = None
        if hasattr(obj.motion, 'theme') and obj.motion.theme:
            theme_data = {
                'id': obj.motion.theme.id,
                'name': obj.motion.theme.name
            }
            
        return {
            'id': obj.motion.id,
            'text': obj.motion.text,
            'theme': theme_data
        }

# Add this serializer to your existing serializers

class UserLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class RoundLogSerializer(serializers.ModelSerializer):
    motion = serializers.SerializerMethodField()
    
    class Meta:
        model = Round
        fields = ['id', 'format', 'motion']
    
    def get_motion(self, obj):
        if (obj.motion):
            return {
                'text': obj.motion.text,
                'theme': obj.motion.theme.name if obj.motion.theme else None
            }
        return {'text': 'No motion', 'theme': None}

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserLogSerializer()
    round = RoundLogSerializer()
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'round', 'role', 'action', 'timestamp']
