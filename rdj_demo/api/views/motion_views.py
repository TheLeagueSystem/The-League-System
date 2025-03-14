# Add to your views or create a new file like motion_views.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from api.models import Motion, Theme
from api.serializers import MotionSerializer, ThemeSerializer

class ThemeListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all themes"""
        themes = Theme.objects.all().order_by('name')
        serializer = ThemeSerializer(themes, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new theme (admin only)"""
        if not request.user.is_admin:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ThemeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MotionGlossaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns a list of all motions for regular users."""
        try:
            motions = Motion.objects.all().order_by('-created_at')
            
            # Optional filtering by theme
            theme_id = request.query_params.get('theme_id', None)
            if theme_id:
                motions = motions.filter(theme_id=theme_id)
                
            # Optional filtering by competition type
            competition = request.query_params.get('competition', None)
            if competition:
                motions = motions.filter(competition_type=competition)
                
            serializer = MotionSerializer(motions, many=True)
            
            # Get all themes and competition types for filters
            themes = Theme.objects.all().order_by('name')
            theme_serializer = ThemeSerializer(themes, many=True)
            unique_competitions = Motion.objects.values_list('competition_type', flat=True).distinct()
            
            return Response({
                "motions": serializer.data,
                "themes": theme_serializer.data,
                "competition_types": list(unique_competitions)
            })
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminMotionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get list of all motions."""
        try:
            motions = Motion.objects.all().order_by('-created_at')
            serializer = MotionSerializer(motions, many=True)
            
            # Return in a format your frontend expects
            return Response({
                'motions': serializer.data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)