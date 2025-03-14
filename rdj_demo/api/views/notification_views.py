from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import Notification
from django.db.models import Q
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from ..permissions import IsStaffUser
from rest_framework.serializers import ModelSerializer, SerializerMethodField

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all notifications for the current user"""
        # Get all notifications from the past 30 days or unread ones
        thirty_days_ago = datetime.now() - timedelta(days=30)
        notifications = Notification.objects.filter(
            Q(recipient=request.user),
            Q(created_at__gte=thirty_days_ago) | Q(read=False)
        )
        
        data = []
        for notification in notifications:
            time_diff = datetime.now().replace(tzinfo=None) - notification.created_at.replace(tzinfo=None)
            
            # Format the time difference
            if time_diff.days > 0:
                if time_diff.days == 1:
                    time_str = "Yesterday"
                else:
                    time_str = f"{time_diff.days} days ago"
            elif time_diff.seconds >= 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif time_diff.seconds >= 60:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                time_str = "Just now"
            
            data.append({
                'id': notification.id,
                'type': notification.type,
                'message': notification.message,
                'link': notification.link,
                'time': time_str,
                'created_at': notification.created_at.isoformat(),
                'read': notification.read
            })
        
        return Response(data)

class NotificationActionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id=None):
        """Mark a notification as read/unread"""
        action = request.data.get('action')
        
        if notification_id:
            # Action on a single notification
            try:
                notification = Notification.objects.get(id=notification_id, recipient=request.user)
                if action == 'mark_read':
                    notification.read = True
                elif action == 'mark_unread':
                    notification.read = False
                notification.save()
                
                return Response({'status': 'success'})
            except Notification.DoesNotExist:
                return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Action on all notifications
            if action == 'mark_all_read':
                Notification.objects.filter(recipient=request.user, read=False).update(read=True)
                return Response({'status': 'success'})
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class NotificationCountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get unread notification count"""
        count = Notification.objects.filter(recipient=request.user, read=False).count()
        return Response({'count': count})

class AdminNotificationSerializer(ModelSerializer):
    recipients = SerializerMethodField()
    sent_by = SerializerMethodField()
    sent_to_all = SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'link', 'created_at', 'recipients', 'sent_by', 'sent_to_all']
    
    def get_recipients(self, obj):
        # If sent to specific users, return their IDs
        if hasattr(obj, 'recipients_list'):
            return obj.recipients_list
        # Otherwise return all recipient IDs
        return [recipient.id for recipient in User.objects.filter(notifications=obj)]
    
    def get_sent_by(self, obj):
        # This would typically come from a field in your model
        # For now, we'll return the first staff user
        staff_user = User.objects.filter(is_staff=True).first()
        return {
            'id': staff_user.id if staff_user else 1,
            'username': staff_user.username if staff_user else 'admin'
        }
    
    def get_sent_to_all(self, obj):
        # Check if this was sent to all users
        # This would typically come from a field in your model
        if hasattr(obj, 'sent_to_all'):
            return obj.sent_to_all
        return len(self.get_recipients(obj)) == User.objects.count()

class AdminNotificationListView(APIView):
    """Admin endpoint to view sent notifications and send new ones."""
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request):
        """Get list of notifications sent by admins."""
        notifications = Notification.objects.filter(type='SYSTEM')[:50]  # Limit to 50 most recent
        serializer = AdminNotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Send a new notification to selected users or all users."""
        try:
            message = request.data.get('message')
            if not message:
                return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            notif_type = request.data.get('type', 'SYSTEM')
            link = request.data.get('link')
            send_to_all = request.data.get('send_to_all', False)
            recipients = request.data.get('recipients', [])
            
            # Get recipients
            if send_to_all:
                users = User.objects.all()
            else:
                if not recipients:
                    return Response({"error": "Recipients are required when not sending to all"}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                users = User.objects.filter(id__in=recipients)
            
            # Create notifications for each recipient
            created_notifications = []
            for user in users:
                notification = Notification.objects.create(
                    recipient=user,
                    type=notif_type,
                    message=message,
                    link=link
                )
                # Add metadata for admin-sent notifications
                notification.sent_to_all = send_to_all
                notification.recipients_list = [u.id for u in users]
                created_notifications.append(notification)
            
            return Response({"message": f"Sent notification to {len(created_notifications)} users"}, 
                          status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, round_id):
        print(f"GET request received for round {round_id}")
        # Rest of the method