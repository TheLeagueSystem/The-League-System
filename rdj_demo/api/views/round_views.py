from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from ..models import Round, RoundAllocation, RoundResult, SpeakerScore, User, Motion
from ..serializers import RoundSerializer, RoundDetailSerializer, RoundAllocationSerializer
from rest_framework.decorators import api_view, permission_classes
from ..services.notification_service import create_notification, create_round_notification
from ..permissions import IsStaffUser
from ..models import ActivityLog

def get_round_participants(round_obj):
    """
    Get all participants for a round, including debaters and adjudicators.
    
    Args:
        round_obj: Round instance
    
    Returns:
        list: List of User objects participating in the round
    """
    from ..models import RoundAllocation
    
    # Get all users allocated to this round
    allocations = RoundAllocation.objects.filter(round=round_obj).select_related('user')
    
    # Extract unique users
    participants = []
    for allocation in allocations:
        participants.append(allocation.user)
    
    return participants

class RoundListView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get all rounds."""
        try:
            rounds = Round.objects.all().order_by('-created_at')
            serializer = RoundSerializer(rounds, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new round."""
        try:
            # Validate format
            format_choice = request.data.get('format')
            if not format_choice or format_choice not in ['ABP', 'PDA']:
                return Response(
                    {"error": "Invalid format. Choose ABP for British Parliamentary or PDA for Asian Parliamentary."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate motion
            motion_id = request.data.get('motion_id')
            if not motion_id:
                return Response({"error": "Motion is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate max_adjudicators
            max_adjudicators = int(request.data.get('max_adjudicators', 3))
            if max_adjudicators < 1:
                return Response({"error": "At least one adjudicator is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the round
            serializer = RoundSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                round_obj = serializer.save()
                return Response({
                    "round_id": round_obj.id,
                    "message": "Round created successfully. Ready for allocation."
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, round_id):
        """Get details of a specific round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Add proper error handling for serialization
            try:
                serializer = RoundDetailSerializer(round_obj, context={'request': request})
                return Response(serializer.data)
            except Exception as serializer_error:
                import traceback
                print(f"Serialization error in RoundDetailView: {str(serializer_error)}")
                print(traceback.format_exc())
                return Response({"error": f"Data processing error: {str(serializer_error)}"}, 
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"General error in RoundDetailView: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundAllocationView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def post(self, request, round_id):
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Get the allocations from the request
            request_data = request.data
            allocations = request_data.get("allocations", [])
            
            # Get existing participants
            participants = get_round_participants(round_obj)
            participant_ids = [p.id for p in participants]
            
            # Filter allocations to only include participants
            valid_allocations = [a for a in allocations if a['user_id'] in participant_ids]
            
            # Clear previous allocations
            RoundAllocation.objects.filter(round=round_obj).delete()
            
            # Create new allocations
            for allocation in valid_allocations:
                user_id = allocation.get("user_id")
                role = allocation.get("role")
                
                user = User.objects.get(id=user_id)
                RoundAllocation.objects.create(
                    round=round_obj,
                    user=user,
                    role=role
                )
                ActivityLog.objects.create(
                    user=user,
                    round=round_obj,
                    role=role,
                    action='allocated'
                )
            
            # Update round status
            round_obj.status = "ALLOCATION"
            round_obj.save()
            
            return Response({"message": "Allocations saved successfully"})
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "One or more users not found"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StartRoundView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def post(self, request, round_id):
        """Start the debate round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Check if round is in allocation state
            if round_obj.status != 'ALLOCATION':
                return Response(
                    {"error": f"Cannot start a round with status '{round_obj.status}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set started time and active status
            round_obj.start_round()
            
            # Get all participants
            participants = get_round_participants(round_obj)  # Implement this based on your models
            
            # Create notifications for all participants
            create_round_notification(
                round_obj,
                participants,
                'ROUND_START',
                'Round #{round_id} is now starting! ({format})',
                '/round/{round_id}'
            )
            
            # Return round details
            serializer = RoundDetailSerializer(round_obj, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundActiveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get active rounds for the current user."""
        try:
            user = request.user
            # Find active rounds where the user has an allocation
            user_allocations = RoundAllocation.objects.filter(
                user=user, 
                round__status='ACTIVE'
            ).select_related('round', 'round__motion', 'round__motion__theme')
            
            if not user_allocations.exists():
                return Response({"message": "No active rounds found for you"}, status=status.HTTP_404_NOT_FOUND)
            
            # Format the response
            active_rounds = []
            for allocation in user_allocations:
                round_obj = allocation.round
                active_rounds.append({
                    "round_id": round_obj.id,
                    "format": round_obj.format,
                    "format_display": round_obj.get_format_display(),
                    "motion": {
                        "text": round_obj.motion.text,
                        "theme": {
                            "name": round_obj.motion.theme.name
                        }
                    },
                    "your_role": allocation.role,
                    "started_at": round_obj.started_at
                })
            
            return Response(active_rounds, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JoinRoundView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Join a round using a code."""
        try:
            # Get the round code from the request
            round_code = request.data.get("round_code", "").strip().upper()
            
            if not round_code:
                return Response({"error": "Round code is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if round exists
            try:
                round_obj = Round.objects.get(round_code=round_code)
            except Round.DoesNotExist:
                return Response({"error": "Invalid round code"}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if round is in a joinable state
            if round_obj.status not in ["SETUP", "ALLOCATION"]:
                return Response({"error": "This round is no longer accepting participants"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is already in the round
            existing_allocation = RoundAllocation.objects.filter(round=round_obj, user=request.user).first()
            
            if existing_allocation:
                # User is already in the round
                return Response({
                    "round_id": round_obj.id,
                    "message": "Already joined this round"
                })
            
            # Add user to the round
            RoundAllocation.objects.create(
                round=round_obj,
                user=request.user,
                role=None  # Role will be assigned later
            )
            
            # Create notification for admin
            create_notification(
                recipient=round_obj.created_by,
                content=f"{request.user.username} has joined round {round_code}",
                notification_type="ROUND_JOIN",
                link=f"/admin/rounds/{round_obj.id}/waiting-room/"
            )
            
            # Create an activity log entry
            ActivityLog.objects.create(
                user=request.user,
                round=round_obj,
                role='Spectator',  # Initial role when joining
                action='joined'
            )
            
            return Response({
                "round_id": round_obj.id,
                "message": "Successfully joined round"
            })
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_round(request, round_id):
    try:
        round_obj = Round.objects.get(id=round_id)
        
        # Check if user is admin
        if not request.user.is_admin:
            return Response({"error": "Only admins can start rounds"}, status=status.HTTP_403_FORBIDDEN)
        
        # Set started time and active status
        round_obj.started_at = timezone.now()
        round_obj.is_active = True
        round_obj.save()
        
        # Rest of your existing code...
    except Round.DoesNotExist:
        return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundResultView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, round_id):
        """Submit results for a round (Chair Adjudicator only)."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Check if round is active
            if round_obj.status != 'ACTIVE':
                return Response(
                    {"error": "Results can only be submitted for active rounds"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify user is chair adjudicator
            user = request.user
            allocation = RoundAllocation.objects.filter(
                round=round_obj, 
                user=user,
                role='Chair Adjudicator'
            ).first()
            
            if not allocation:
                return Response(
                    {"error": "Only the Chair Adjudicator can submit round results"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Process the submitted data
            data = request.data
            winning_side = data.get('winning_side')
            summary = data.get('summary')
            speaker_scores = data.get('speaker_scores', [])
            
            # Validate required fields
            if not winning_side or not summary:
                return Response(
                    {"error": "Winning side and summary are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create result record
            result = RoundResult.objects.create(
                round=round_obj,
                winning_side=winning_side,
                summary=summary,
                submitted_by=user
            )
            
            # Process speaker scores
            for score_data in speaker_scores:
                user_id = score_data.get('user_id')
                score = score_data.get('score')
                comments = score_data.get('comments', '')
                
                try:
                    speaker_allocation = RoundAllocation.objects.get(
                        round=round_obj,
                        user_id=user_id
                    )
                    
                    SpeakerScore.objects.create(
                        result=result,
                        allocation=speaker_allocation,
                        score=score,
                        comments=comments
                    )
                except RoundAllocation.DoesNotExist:
                    # Log error but continue
                    print(f"Warning: User {user_id} not found in round {round_id}")
            
            # Mark round as completed
            round_obj.complete_round()
            
            # First get the participants:
            participants = get_round_participants(round_obj)

            # Then create notifications for them
            create_round_notification(
                round_obj,
                participants, 
                'RESULTS_AVAILABLE',
                'Results for {format} round are now available!',
                '/round/{round_id}'
            )
            
            # Create activity log entries for completion
            for allocation in round_obj.allocations.all():
                ActivityLog.objects.create(
                    user=allocation.user,
                    round=round_obj,
                    role=allocation.role,
                    action='completed'
                )
            
            return Response({
                "message": "Round results submitted successfully",
                "round_id": round_obj.id
            }, status=status.HTTP_201_CREATED)
            
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request, round_id):
        """Get results for a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Try to get result
            try:
                result = RoundResult.objects.get(round=round_obj)
                
                # Format speaker scores
                scores = []
                for score in result.speaker_scores.all():
                    scores.append({
                        "user_id": score.allocation.user.id,
                        "username": score.allocation.user.username,
                        "role": score.allocation.role,
                        "score": float(score.score),
                        "comments": score.comments
                    })
                
                return Response({
                    "winning_side": result.winning_side,
                    "summary": result.summary,
                    "submitted_by": {
                        "id": result.submitted_by.id,
                        "username": result.submitted_by.username
                    },
                    "submitted_at": result.submitted_at,
                    "speaker_scores": scores
                }, status=status.HTTP_200_OK)
                
            except RoundResult.DoesNotExist:
                return Response(
                    {"error": "Results not found for this round"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Update your AdminRoundListView to handle POST requests

class AdminRoundListView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request):
        """Get list of all rounds."""
        try:
            rounds = Round.objects.all().order_by('-created_at')
            serializer = RoundSerializer(rounds, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Create a new round."""
        try:
            # Validate max_adjudicators
            max_adjudicators = int(request.data.get('max_adjudicators', 3))
            if max_adjudicators < 1:
                return Response({"error": "At least one adjudicator is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle motion creation if requested
            if request.data.get('new_motion_text') and request.data.get('new_motion_theme'):
                # Create a new motion
                from ..models import Motion, Theme
                
                theme, _ = Theme.objects.get_or_create(
                    name=request.data.get('new_motion_theme')
                )
                
                motion = Motion.objects.create(
                    text=request.data.get('new_motion_text'),
                    theme=theme,
                    competition_type=request.data.get('competition_type', 'General')
                )
                request.data['motion_id'] = motion.id
            
            # Create the round
            serializer = RoundSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                round_obj = serializer.save()
                return Response({
                    "round_id": round_obj.id,
                    "message": "Round created successfully. Ready for allocation."
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminRoundDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]  # Make sure staff permission is required
    
    def get(self, request, round_id):
        """Get details of a specific round for admin."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Safely create serializer with extra motion handling
            try:
                serializer = RoundDetailSerializer(round_obj, context={'request': request})
                return Response(serializer.data)
            except Exception as serializer_error:
                import traceback
                print(f"Serialization error: {str(serializer_error)}")
                print(traceback.format_exc())
                
                # Create a simpler response if serialization fails
                basic_data = {
                    'id': round_obj.id,
                    'format': round_obj.format,
                    'status': round_obj.status,
                    'round_code': round_obj.round_code,
                    'created_at': round_obj.created_at.isoformat()
                }
                
                if round_obj.motion:
                    basic_data['motion'] = {
                        'id': round_obj.motion.id,
                        'text': round_obj.motion.text
                    }
                else:
                    basic_data['motion'] = None
                
                return Response(basic_data)
                
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"General error: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, round_id):
        """Delete a round."""
        try:
            from django.db import connection
            
            # Use direct SQL to delete round and related data
            with connection.cursor() as cursor:
                # First delete all allocations
                cursor.execute("DELETE FROM api_roundallocation WHERE round_id = %s", [round_id])
                
                # Then delete the round itself
                cursor.execute("DELETE FROM api_round WHERE id = %s", [round_id])
            
            return Response({"message": "Round successfully deleted"}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print("Error in round deletion:", str(e))
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TerminateRoundView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, round_id):
        """Force-terminate an active round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            if round_obj.status != 'ACTIVE':
                return Response({"error": "Only active rounds can be terminated"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update round status
            round_obj.status = 'TERMINATED'
            round_obj.is_active = False
            round_obj.completed_at = timezone.now()
            round_obj.save()
            
            return Response({"message": "Round terminated successfully"}, status=status.HTTP_200_OK)
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundParticipantsView(APIView):
    """View for getting all participants in a round."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, round_id):
        """Get all participants in a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            participants = get_round_participants(round_obj)
            
            from ..serializers import UserSerializer
            serializer = UserSerializer(participants, many=True)
            
            return Response(serializer.data)
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundStartView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, round_id):
        """Start a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Check if round is in the right state
            if round_obj.status != 'ALLOCATION':
                return Response(
                    {"error": f"Cannot start a round with status '{round_obj.status}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate allocations
            # ... (your existing validation logic)
            
            # Start the round
            round_obj.status = 'ACTIVE'
            round_obj.is_active = True
            round_obj.started_at = timezone.now()
            round_obj.save()
            
            return Response({
                "message": "Round started successfully",
                "round_id": round_obj.id
            })
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundStatusView(APIView):
    def get(self, request, round_id):
        """Get the current status of a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            return Response({
                'status': round_obj.status,
            })
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundWaitingRoomView(APIView):
    """View for the waiting room page of a round."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, round_id):
        """Get waiting room data for a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # First, make sure the current user is registered to this round
            participant_ids = [p.id for p in get_round_participants(round_obj)]
            if request.user.id not in participant_ids and not request.user.is_staff:
                # Auto-join the round for the current user
                RoundAllocation.objects.create(
                    round=round_obj,
                    user=request.user,
                    role=None  # Role will be assigned later
                )
            
            # Get round data using the existing serializer
            serializer = RoundDetailSerializer(round_obj, context={'request': request})
            
            return Response(serializer.data)
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add this class after your AdminRoundListView class
class AdminRoundDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request, round_id):
        """Get details of a specific round for admin."""
        try:
            print(f"GET request received for round {round_id} by user {request.user.username}")
            print(f"User permissions: is_staff={request.user.is_staff}, is_superuser={request.user.is_superuser}")
            
            # Check if round exists before trying to serialize
            round_exists = Round.objects.filter(id=round_id).exists()
            if not round_exists:
                print(f"Round {round_id} not found in database")
                return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
            
            round_obj = Round.objects.get(id=round_id)
            
            # Detailed logging about the round
            print(f"Round details: id={round_obj.id}, format={round_obj.format}, status={round_obj.status}")
            
            # Check if serializer will work
            try:
                print("Attempting to serialize round")
                serializer = RoundDetailSerializer(round_obj)
                data = serializer.data
                print("Serialization successful")
                return Response(data)
            except Exception as serializer_error:
                print(f"Serialization error: {str(serializer_error)}")
                import traceback
                print(traceback.format_exc())
                return Response({"error": f"Serialization error: {str(serializer_error)}"}, 
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Round.DoesNotExist:
            print(f"Round {round_id} not found")
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"Error in AdminRoundDetailView: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add this view to your round_views.py
class RoundAllocationDetailsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    
    def get(self, request, round_id):
        """Get simplified round details needed for allocation page."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Create a simplified response with just the fields needed
            response_data = {
                'id': round_obj.id,
                'format': round_obj.format,
                'max_adjudicators': round_obj.max_adjudicators,
                'round_code': round_obj.round_code
            }
            
            # Only include motion if it exists
            if round_obj.motion:
                response_data['motion'] = {
                    'id': round_obj.motion.id,
                    'text': round_obj.motion.text,
                }
                
                if round_obj.motion.theme:
                    response_data['motion']['theme'] = {
                        'id': round_obj.motion.theme.id,
                        'name': round_obj.motion.theme.name
                    }
            
            return Response(response_data)
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoundSetupView(APIView):
    """Unified view for round setup (combines waiting room and allocation)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, round_id):
        """Get setup data for a round."""
        try:
            round_obj = Round.objects.get(id=round_id)
            
            # Auto-join users if needed (from your waiting room view)
            if not request.user.is_staff:
                participant_ids = [p.id for p in get_round_participants(round_obj)]
                if request.user.id not in participant_ids:
                    RoundAllocation.objects.create(
                        round=round_obj,
                        user=request.user,
                        role=None
                    )
            
            # Get standard round data
            serializer = RoundDetailSerializer(round_obj, context={'request': request})
            
            # Return data
            return Response(serializer.data)
        except Round.DoesNotExist:
            return Response({"error": "Round not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)