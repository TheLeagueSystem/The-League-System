from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework import status
from ..models import Round, RoundAllocation, RoundResult, SpeakerScore

class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns the profile of the logged-in user."""
        user = request.user
        data = {
            "message": "User Dashboard",
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_staff
        }
        return Response(data, status=status.HTTP_200_OK)

class VetoMotionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, round_id):
        """Allows a user to veto a motion (if enabled)."""
        return Response({"message": f"Motion vetoed for round {round_id}"})

class UserPerformanceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's performance data as debater and adjudicator."""
        user = request.user
        
        try:
            # Get allocations for this user
            allocations = RoundAllocation.objects.filter(user=user).select_related('round')
            
            # Separate debates from adjudications
            debate_allocations = allocations.filter(
                role__in=['Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip',
                          'Leader of Opposition', 'Deputy Leader of Opposition', 'Member of Opposition', 'Opposition Whip']
            )
            
            adjudicator_allocations = allocations.filter(
                role__in=['Chair Adjudicator', 'Panelist', 'Trainee']
            )
            
            # Build response data
            response_data = {
                'debater': self._get_debater_stats(user, debate_allocations),
                'adjudicator': self._get_adjudicator_stats(user, adjudicator_allocations)
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_debater_stats(self, user, allocations):
        """Get statistics for user as a debater."""
        # Get speaker scores
        speaker_scores = []
        rounds_with_scores = []
        roles_distribution = {
            'Prime Minister': 0, 'Deputy Prime Minister': 0, 'Member of Government': 0, 'Government Whip': 0,
            'Leader of Opposition': 0, 'Deputy Leader of Opposition': 0, 'Member of Opposition': 0, 'Opposition Whip': 0
        }
        wins = 0
        losses = 0
        recent_rounds = []
        
        for allocation in allocations:
            # Update roles distribution
            if allocation.role in roles_distribution:
                roles_distribution[allocation.role] += 1
                
            # Get score for this allocation if round has results
            try:
                round_result = allocation.round.result
                speaker_score = SpeakerScore.objects.filter(
                    result=round_result,
                    allocation=allocation
                ).first()
                
                if speaker_score:
                    speaker_scores.append(speaker_score.score)
                    rounds_with_scores.append(allocation.round.id)
                    
                    # Check if this user's side won
                    government_roles = ['Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip']
                    opposition_roles = ['Leader of Opposition', 'Deputy Leader of Opposition', 'Member of Opposition', 'Opposition Whip']
                    
                    user_side = 'GOVERNMENT' if allocation.role in government_roles else 'OPPOSITION'
                    if round_result.winning_side == user_side:
                        wins += 1
                    else:
                        losses += 1
                    
                    # Add to recent rounds
                    if len(recent_rounds) < 5:  # Limit to 5 recent rounds
                        recent_rounds.append({
                            'id': allocation.round.id,
                            'date': allocation.round.completed_at.strftime('%Y-%m-%d') if allocation.round.completed_at else 'N/A',
                            'role': allocation.role,
                            'motion': allocation.round.motion.text,
                            'score': speaker_score.score,
                            'result': 'Won' if round_result.winning_side == user_side else 'Lost'
                        })
            except:
                # No result yet for this round
                pass
        
        # Prepare data for graphs
        score_progression = {
            'labels': [f"Round {i+1}" for i in range(len(speaker_scores))],
            'scores': speaker_scores
        }
        
        return {
            'score_progression': score_progression,
            'roles_distribution': roles_distribution,
            'win_loss_ratio': {'wins': wins, 'losses': losses},
            'recent_rounds': recent_rounds,
            'rounds_count': len(allocations)
        }
    
    def _get_adjudicator_stats(self, user, allocations):
        """Get statistics for user as an adjudicator."""
        # Count roles
        chair_count = 0
        panelist_count = 0
        trainee_count = 0
        
        # Count formats
        format_experience = {
            'ABP': 0,  # British Parliamentary
            'PDA': 0,  # Asian Parliamentary
            'WS': 0    # World Schools
        }
        
        # Rounds by month (for last 6 months)
        import datetime
        today = datetime.date.today()
        months = []
        rounds_by_month = []
        
        for i in range(5, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
                
            month_name = datetime.date(year, month, 1).strftime('%b')
            months.append(month_name)
            rounds_by_month.append(0)
        
        # Recent adjudications
        recent_adjudications = []
        
        for allocation in allocations:
            # Update role counts
            if allocation.role == 'Chair Adjudicator':
                chair_count += 1
            elif allocation.role == 'Panelist':
                panelist_count += 1
            else:  # 'Trainee'
                trainee_count += 1
            
            # Update format experience
            format_experience[allocation.round.format] = format_experience.get(allocation.round.format, 0) + 1
            
            # Update rounds by month
            if allocation.round.started_at:
                round_date = allocation.round.started_at.date()
                months_ago = (today.year - round_date.year) * 12 + today.month - round_date.month
                if months_ago >= 0 and months_ago < 6:
                    rounds_by_month[5 - months_ago] += 1
            
            # Add to recent adjudications
            if allocation.round.completed_at and len(recent_adjudications) < 5:
                format_display = 'British Parliamentary' if allocation.round.format == 'ABP' else 'Asian Parliamentary'
                recent_adjudications.append({
                    'id': allocation.round.id,
                    'date': allocation.round.completed_at.strftime('%Y-%m-%d'),
                    'role': allocation.role,
                    'motion': allocation.round.motion.text,
                    'format': format_display
                })
        
        return {
            'chair_panelist_ratio': {
                'chair': chair_count,
                'panelist': panelist_count,
                'trainee': trainee_count
            },
            'format_experience': format_experience,
            'rounds_by_month': {
                'labels': months,
                'counts': rounds_by_month
            },
            'recent_adjudications': recent_adjudications,
            'total_rounds': len(allocations)
        }

class DebateHistoryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's debate history statistics."""
        try:
            # For now, return mock data
            mock_data = {
                "total_rounds": 22,
                "debates": {
                    "count": 14,
                    "avg_score": 81.5,
                    "roles": {
                        "Prime Minister": 3,
                        "Deputy Prime Minister": 5,
                        "Leader of Opposition": 2,
                        "Deputy Leader of Opposition": 4
                    },
                    "winning_percentage": 64.3
                },
                "adjudications": {
                    "count": 8,
                    "avg_rating": 8.2,
                    "roles": {
                        "chair": 3,
                        "panelist": 4,
                        "trainee": 1
                    }
                },
                "performance_trend": {
                    "dates": ["2024-12-05", "2024-12-15", "2024-12-30", "2025-01-12", "2025-01-28", "2025-02-15"],
                    "scores": [75, 78, 76, 82, 84, 80]
                },
                "role_distribution": {
                    "labels": ["Prime Minister", "Deputy PM", "Leader of Opp", "Deputy LO"],
                    "data": [5, 3, 4, 2]
                }
            }
            return Response(mock_data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DebateHistoryDebatesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's debate performances."""
        try:
            # For now, return mock data
            mock_data = {
                "performances": [
                    {
                        "round_id": 1, 
                        "date": "2025-02-15", 
                        "role": "Deputy PM", 
                        "format": "Asian Parliamentary", 
                        "motion": "THW ban social media for children under 16", 
                        "speaker_score": 84, 
                        "result": "Won"
                    },
                    {
                        "round_id": 2, 
                        "date": "2025-01-28", 
                        "role": "Leader of Opposition", 
                        "format": "Asian Parliamentary", 
                        "motion": "THW implement universal basic income", 
                        "speaker_score": 82, 
                        "result": "Lost"
                    },
                    {
                        "round_id": 3, 
                        "date": "2025-01-12", 
                        "role": "Prime Minister", 
                        "format": "Asian Parliamentary", 
                        "motion": "THS mandatory voting in elections", 
                        "speaker_score": 86, 
                        "result": "Won"
                    }
                ]
            }
            return Response(mock_data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DebateHistoryAdjudicationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's adjudication performances."""
        try:
            # For now, return mock data
            mock_data = {
                "performances": [
                    {
                        "round_id": 1, 
                        "date": "2025-02-10", 
                        "role": "Chair Adjudicator", 
                        "format": "Asian Parliamentary", 
                        "motion": "THW ban private healthcare", 
                        "rating": 8.5
                    },
                    {
                        "round_id": 2, 
                        "date": "2025-01-25", 
                        "role": "Panelist", 
                        "format": "British Parliamentary", 
                        "motion": "THS the rise of AI in creative industries", 
                        "rating": 8.2
                    },
                    {
                        "round_id": 3, 
                        "date": "2025-01-14", 
                        "role": "Chair Adjudicator", 
                        "format": "Asian Parliamentary", 
                        "motion": "THW make voting mandatory", 
                        "rating": 8.7
                    }
                ]
            }
            return Response(mock_data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)