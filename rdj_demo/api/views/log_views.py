from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import ActivityLog
from ..serializers import ActivityLogSerializer
from ..permissions import IsStaffUser

class AdminLogsAttendanceView(APIView):
    """Admin endpoint to view attendance logs."""
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request):
        """Get attendance logs."""
        logs = ActivityLog.objects.select_related('user', 'round', 'round__motion', 'round__motion__theme')
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

class AdminLogsSystemView(APIView):
    """Admin endpoint to view system logs."""
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request):
        """Get system logs (placeholder for future implementation)."""
        # For now, return empty array
        return Response([])