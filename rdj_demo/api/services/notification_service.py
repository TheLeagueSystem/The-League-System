from ..models import Notification, User

def create_notification(user, notif_type, message, link=None):
    """
    Create a notification for a user
    
    Args:
        user (User): The recipient of the notification
        notif_type (str): Type of notification from Notification.NOTIFICATION_TYPES
        message (str): The notification message
        link (str, optional): URL to navigate to when clicked. Defaults to None.
    
    Returns:
        Notification: The created notification
    """
    notification = Notification.objects.create(
        recipient=user,
        type=notif_type,
        message=message,
        link=link
    )
    return notification

def create_round_notification(round_obj, users, notif_type, message_template, link_template=None):
    """
    Create notifications for users about a round
    
    Args:
        round_obj: The debate round
        users: List of users to notify
        notif_type: Type of notification
        message_template: Template string for message (can contain {round_id}, {format}, etc.)
        link_template: Template for the link URL (optional)
    
    Returns:
        list: List of created notifications
    """
    notifications = []
    
    for user in users:
        message = message_template.format(
            round_id=round_obj.id,
            format=round_obj.get_format_display(),
            round_code=getattr(round_obj, 'round_code', ''),
            # Add more fields as needed
        )
        
        link = None
        if link_template:
            link = link_template.format(round_id=round_obj.id)
        
        notification = create_notification(user, notif_type, message, link)
        notifications.append(notification)
    
    return notifications