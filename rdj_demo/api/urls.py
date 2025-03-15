from django.urls import path
from django.contrib.auth import views as auth_views
from .views import general_views, user_views, notification_views
from .views.admin_views import (
    AdminDashboardView, 
    UserListView, 
    UserDetailView, 
    MotionListView as AdminMotionListView
)
from .views.user_views import UserDashboardView
from .views.auth_views import login_view
from .views.motion_views import MotionGlossaryView, ThemeListView
from .views.round_views import (
    AdminRoundListView, AdminRoundDetailView, TerminateRoundView,
    RoundAllocationView, StartRoundView, RoundParticipantsView,
    RoundDetailView, RoundResultView, JoinRoundView, 
    RoundStatusView, RoundWaitingRoomView, RoundAllocationDetailsView, RoundSetupView
)
from .views.utils import check_db_structure, check_db_connection
from .views.log_views import AdminLogsAttendanceView, AdminLogsSystemView


urlpatterns = [
    # Authentication Routes
    path('login/', login_view, name='login'),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    
    # General API Routes
    path("home/", general_views.HomeView.as_view(), name="home"),

    # User Routes
    path("user/dashboard/", UserDashboardView.as_view(), name="user_dashboard"),
    path('users/me/performance/', user_views.UserPerformanceView.as_view(), name='user_performance'),
    path('user/debate-history/stats/', user_views.DebateHistoryStatsView.as_view(), name='debate_history_stats'),
    path('user/debate-history/debates/', user_views.DebateHistoryDebatesView.as_view(), name='debate_history_debates'),
    path('user/debate-history/adjudications/', user_views.DebateHistoryAdjudicationsView.as_view(), name='debate_history_adjudications'),
    
    # Admin Routes
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path("admin/users/", UserListView.as_view(), name="admin_users"),
    path("admin/users/<int:pk>/", UserDetailView.as_view(), name="admin_user_detail"),

    # Theme Routes
    path("themes/", ThemeListView.as_view(), name="themes"),
    
    # Motion Routes
    path("admin/motions/", AdminMotionListView.as_view(), name="admin_motions"),
    path("admin/motions/<int:motion_id>/", AdminMotionListView.as_view(), name="admin_motion_detail"),
    path("motions/glossary/", MotionGlossaryView.as_view(), name="motion_glossary"),
    path('motions/', AdminMotionListView.as_view(), name='motion_list'),
    
    # Utils Routes
    path('utils/check-db/', check_db_structure, name='check_db'),
    path('debug/db-structure/', check_db_structure, name='check_db_structure'),
    path('debug/db-connection/', check_db_connection, name='check_db_connection'),

    # Round management endpoints
    path("admin/rounds/", AdminRoundListView.as_view(), name="admin_rounds_list"),
    path("admin/rounds/<int:round_id>/", AdminRoundDetailView.as_view(), name="admin_round_detail"),
    path("admin/rounds/<int:round_id>/terminate/", TerminateRoundView.as_view(), name="terminate_round"),
    path("admin/rounds/<int:round_id>/allocate/", RoundAllocationView.as_view(), name="admin_round_allocate"),
    path("admin/rounds/<int:round_id>/start/", StartRoundView.as_view(), name="admin_round_start"),
    path("admin/rounds/<int:round_id>/allocation-details/", RoundAllocationDetailsView.as_view(), name="round_allocation_details"),
    path("round/<int:round_id>/participants/", RoundParticipantsView.as_view(), name="round_participants"),
    path("round/<int:round_id>/", RoundDetailView.as_view(), name="round_detail"),
    path("round/<int:round_id>/results/", RoundResultView.as_view(), name="round_results"),
    path('rounds/join/', JoinRoundView.as_view(), name='join_round'),
    path('round/<int:round_id>/participants/', RoundParticipantsView.as_view(), name="round_participants"),
    path('round/<int:round_id>/status/', RoundStatusView.as_view(), name="round_status"),
    path('round/<int:round_id>/waiting-room/', RoundWaitingRoomView.as_view(), name='round_waiting_room'),
    path('round/<int:round_id>/setup/', RoundSetupView.as_view(), name='round_setup'),

    # Notification Routes
    path('notifications/', notification_views.NotificationListView.as_view(), name='notifications'),
    path('notifications/count/', notification_views.NotificationCountView.as_view(), name='notification_count'),
    path('notifications/<int:notification_id>/', notification_views.NotificationActionView.as_view(), name='notification_action'),
    path('notifications/actions/', notification_views.NotificationActionView.as_view(), name='notification_actions'),
    path('admin/notifications/', notification_views.AdminNotificationListView.as_view(), name='admin_notifications'),

    # Log Routes
    path('admin/logs/attendance/', AdminLogsAttendanceView.as_view(), name='admin_logs_attendance'),
    path('admin/logs/system/', AdminLogsSystemView.as_view(), name='admin_logs_system'),
]
