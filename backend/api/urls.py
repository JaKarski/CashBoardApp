from django.urls import path
from .views import CreateUserView
from django.urls import path
from .views import CheckSuperuserStatusView, CreateUserView, MyTokenObtainPairView, GameCreateView, JoinGameView, PlayerListView, PlayerActionView, CheckPlayerInGameView, GameDataView, GameAdditionalDataView, EndGameView, UserDetailView, UserStatsView, DebtSettlementView, SendDebtView, AcceptDebtView, UserPlotDataView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('check-superuser/', CheckSuperuserStatusView.as_view(), name='check_superuser'),
    path('user/', UserDetailView.as_view(), name='user-detail'),
    path("user/register/", CreateUserView.as_view(), name="register"),
    path("token/", MyTokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("games/create/", GameCreateView.as_view(), name="create-game"),
    path('games/join/', JoinGameView.as_view(), name='join-game'),
    path('games/<str:game_code>/players/', PlayerListView.as_view(), name='player-list'),
    path('games/<str:game_code>/action/', PlayerActionView.as_view(), name='player-action'),
    path('games/<str:game_code>/check-player/', CheckPlayerInGameView.as_view(), name='check-player-in-game'),
    path('games/<str:game_code>/data/', GameDataView.as_view(), name='game-data'),
    path('games/<str:game_code>/additional-data/', GameAdditionalDataView.as_view(), name='game-additional-data'),
    path('games/<str:game_code>/end-game/', EndGameView.as_view(), name='end-game'),
    path('user/stats/', UserStatsView.as_view(), name='user-stats'),
    path('debts/', DebtSettlementView.as_view(), name='debt-settlement'),
    path('debts/send/<int:debt_id>/', SendDebtView.as_view(), name='send-debt'),
    path('debts/accept/<int:debt_id>/', AcceptDebtView.as_view(), name='accept-debt'),
    path('user/plot-data/', UserPlotDataView.as_view(), name='user-plot-data'),
]

