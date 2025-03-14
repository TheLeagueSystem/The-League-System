from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from api.models import User, Motion, Theme  # Make sure Theme is imported
from api.serializers import UserSerializer, MotionSerializer, ThemeSerializer

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Returns data for the admin dashboard."""
        return Response({"message": "Admin Dashboard"})

class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Returns a list of all users."""
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response({"users": serializer.data})
    
    def post(self, request):
        """Create a new user."""
        data = request.data.copy()
        
        # Hash the password
        if 'password' in data:
            data['password'] = make_password(data['password'])
            
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [IsAdminUser]
    
    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get a specific user."""
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, pk):
        """Update a specific user."""
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        data = request.data.copy()
        
        # Hash the password if provided
        if 'password' in data:
            data['password'] = make_password(data['password'])
            
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete a specific user."""
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response({"error": "Cannot delete your own account"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PromoteUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        """Promotes a user to admin."""
        return Response({"message": f"User {user_id} promoted to admin"})

class StartRoundView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        """Starts a debate round with the selected format, motion, and adjudicators."""
        return Response({"message": "Round started"})

class MotionListView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Returns a list of all motions."""
        try:
            motions = Motion.objects.all().order_by('-created_at')
            serializer = MotionSerializer(motions, many=True)
            
            # Also include themes for the form dropdown
            themes = Theme.objects.all().order_by('name')
            theme_serializer = ThemeSerializer(themes, many=True)
            
            return Response({
                "motions": serializer.data,
                "themes": theme_serializer.data
            })
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new motion."""
        try:
            print("Request data:", request.data)
            
            # Check if theme is provided as a string
            if 'theme' in request.data and isinstance(request.data['theme'], str):
                theme_name = request.data['theme']
                
                # Get or create the theme
                theme, created = Theme.objects.get_or_create(name=theme_name.strip())
                
                # Replace the theme string with the theme ID for the serializer
                data = request.data.copy()
                data['theme_id'] = theme.id
                if 'theme' in data:
                    del data['theme']
                
                serializer = MotionSerializer(data=data)
            else:
                # Use the data as is (assuming theme_id is provided)
                serializer = MotionSerializer(data=request.data)
            
            if serializer.is_valid():
                motion = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("Serializer errors:", serializer.errors)
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("Exception in post:", str(e))
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, motion_id=None):
        """Delete a specific motion."""
        try:
            if not motion_id:
                return Response(
                    {"error": "Motion ID is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            motion = Motion.objects.filter(id=motion_id).first()
            if not motion:
                return Response(
                    {"error": f"Motion with ID {motion_id} not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Delete the motion
            motion.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import traceback
            print("Exception in delete:", str(e))
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
