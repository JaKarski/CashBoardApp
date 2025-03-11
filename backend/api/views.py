from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, F, DurationField, Avg, ExpressionWrapper, Max
from django.db import transaction
from decimal import Decimal
from datetime import datetime, timedelta
from collections import defaultdict
from api.tasks import send_game_summary_email
from .models import Game, PlayerToGame, Action, Statistics, Debts
from .serializers import (
    UserSerializer, GameSerializer, PlayerToGameSerializer, PlayerActionSerializer, 
    GameDataSerializer, GameAdditionalDataSerializer, PlayerDataSerializer, UserStatsSerializer
)


class CreateUserView(generics.CreateAPIView):
    """Allows new users to register an account."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(APIView):
    """Retrieves details of the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })


class MyTokenObtainPairView(TokenObtainPairView):
    """Handles JWT authentication and updates the last login timestamp upon successful login."""
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        username = request.data.get("username", None)
        if username:
            try:
                user = User.objects.get(username=username)
                user.last_login = timezone.now()
                user.save()
            except User.DoesNotExist:
                pass

        return response


class CheckSuperuserStatusView(APIView):
    """Checks if the currently authenticated user is a superuser."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'is_superuser': request.user.is_superuser})


class GameCreateView(generics.CreateAPIView):
    """Allows admin users to create a new game session."""
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        """Creates a new game and assigns the creator as the first player."""
        with transaction.atomic():
            game = serializer.save(creator=self.request.user)
            PlayerToGame.objects.create(player=self.request.user, game=game)
            self.game_code = game.code

    def post(self, request, *args, **kwargs):
        """Returns the generated game code after creation."""
        response = super().post(request, *args, **kwargs)
        return Response({"code": self.game_code}, status=status.HTTP_201_CREATED)


class JoinGameView(APIView):
    """Allows authenticated users to join a game using a room code."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')
        if not room_code:
            raise ValidationError({"room_code": "This field is required."})

        try:
            game = Game.objects.get(code=room_code)
        except Game.DoesNotExist:
            raise NotFound("The game with the specified code was not found.")

        if game.is_end:
            raise PermissionDenied("Cannot join a game that has already ended.")

        if PlayerToGame.objects.filter(player=request.user, game=game).exists():
            return Response({"detail": "Already attached to this game."}, status=status.HTTP_400_BAD_REQUEST)

        PlayerToGame.objects.create(player=request.user, game=game)
        return Response({"detail": "Included in the game!"}, status=status.HTTP_200_OK)


class PlayerListView(generics.ListAPIView):
    """Retrieves a list of players in a given game session."""
    permission_classes = [IsAuthenticated]
    serializer_class = PlayerToGameSerializer

    def get(self, request, game_code, *args, **kwargs):
        game = get_object_or_404(Game, code=game_code)

        if request.user.is_superuser:
            players = PlayerToGame.objects.filter(game=game)
        else:
            players = PlayerToGame.objects.filter(game=game, player=request.user)

        serializer = self.serializer_class(players, many=True)
        return Response({
            'players': serializer.data,
            'buy_in': game.buy_in
        })


class PlayerActionView(APIView):
    """Handles player actions such as 'rebuy' and 'back' within a game."""
    permission_classes = [IsAuthenticated]

    def post(self, request, game_code, *args, **kwargs):
        serializer = PlayerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_type = serializer.validated_data['action']
        player_username = serializer.validated_data['username']

        if action_type not in ['rebuy', 'back']:
            return Response({"detail": "Unknown action type."}, status=status.HTTP_400_BAD_REQUEST)

        game = get_object_or_404(Game, code=game_code)
        player_to_game = get_object_or_404(PlayerToGame, player__username=player_username, game=game)

        if action_type == 'rebuy':
            return self.handle_rebuy(player_to_game)
        elif action_type == 'back':
            if not request.user.is_superuser:
                raise PermissionDenied("Only superusers can undo a rebuy.")
            return self.handle_back(player_to_game)

    def handle_rebuy(self, player_to_game):
        """Processes a rebuy action for a player in the game."""
        Action.objects.create(player_to_game=player_to_game, multiplier=1)
        return Response({"detail": f"Rebuy added for {player_to_game.player.username}!"}, status=status.HTTP_200_OK)

    def handle_back(self, player_to_game):
        """Reverts the last rebuy action for a player, if possible."""
        last_action = Action.objects.filter(player_to_game=player_to_game).order_by('-action_time').first()
        if last_action:
            last_action.delete()
            return Response({"detail": f"The last rebuy was undone for {player_to_game.player.username}!"}, status=status.HTTP_200_OK)
        return Response({"detail": f"Player {player_to_game.player.username} has no actions to undo."}, status=status.HTTP_400_BAD_REQUEST)


class GameDataView(APIView):
    """Provides statistics and financial data related to a specific game session."""
    permission_classes = [IsAuthenticated]

    def get(self, request, game_code):
        try:
            # Retrieve the game by its code
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            return Response({"detail": "Game not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is assigned to the game
        if not PlayerToGame.objects.filter(player=request.user, game=game).exists():
            # Raise 403 Forbidden if the user is not assigned to the game
            raise PermissionDenied("You do not have access to this game.")

        # Calculate the total money on the table from player actions
        total_money_on_table = Action.objects.filter(player_to_game__game=game).aggregate(
            total=Sum(F('multiplier') * F('player_to_game__game__buy_in'))
        )['total'] or 0  # Default to 0 if there are no actions

        # Count the number of players in the game
        number_of_players = PlayerToGame.objects.filter(game=game).count()

        # Calculate the average stack
        avg_stack = total_money_on_table / number_of_players if number_of_players > 0 else 0

        # Prepare data for the serializer
        data = {
            'blinds': game.blind,
            'game_start_time': game.start_time,
            'money_on_table': total_money_on_table,
            'number_of_players': number_of_players,
            'avg_stack': avg_stack,
        }

        # Serialize the data and return the response
        serializer = GameDataSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GameAdditionalDataView(APIView):
    """Retrieves additional data related to a specific game session."""

    permission_classes = [IsAuthenticated]

    def get(self, request, game_code):
        try:
            game = Game.objects.filter(code=game_code, players__player=request.user).distinct().get()
        except Game.DoesNotExist:
            raise PermissionDenied("You do not have access to this game or the game does not exist.")

        serializer = GameAdditionalDataSerializer(game)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EndGameView(APIView):
    """Handles the process of ending a game, calculating statistics, settling debts, and sending summary emails."""

    permission_classes = [IsAuthenticated]

    def post(self, request, game_code, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can end the game.")

        game = get_object_or_404(Game, code=game_code)
        serializer = PlayerDataSerializer(data=request.data.get('players', []), many=True)
        serializer.is_valid(raise_exception=True)

        players_data = serializer.validated_data

        if not players_data:
            return Response({"detail": "No player data provided."}, status=status.HTTP_400_BAD_REQUEST)

        players = User.objects.filter(username__in=[p['player'] for p in players_data])
        if players.count() != len(players_data):
            return Response({"detail": "Some players do not exist."}, status=status.HTTP_404_NOT_FOUND)

        total_balance = sum(player.get('cash_out', 0) - player.get('buy_in', 0) for player in players_data)
        if total_balance != 0:
            return Response(
                {"detail": "The total difference between 'cash_out' and 'buy_in' must be 0."},
                status=status.HTTP_400_BAD_REQUEST
            )

        for player_data in players_data:
            player = players.get(username=player_data['player'])
            player_to_game = PlayerToGame.objects.filter(player=player, game=game).first()

            if not player_to_game:
                return Response({"detail": f"Player {player.username} is not part of this game."}, status=status.HTTP_404_NOT_FOUND)

            Statistics.objects.create(
                player_to_game=player_to_game,
                buy_in=Decimal(player_data['buy_in']),
                cash_out=Decimal(player_data['cash_out']),
                cash_out_time=timezone.now()
            )

        transactions = self.settle_debts(players_data, game)

        game.is_end = True
        game.end_time = timezone.now()
        game.game_time = game.end_time - game.start_time
        game.save()

        for player_data in players_data:
            player = players.get(username=player_data['player'])
            if player.email:  
                game_duration = Decimal(game.game_time.total_seconds()) / Decimal(3600) if game.game_time else Decimal(0)

                buy_in = Decimal(player_data["buy_in"])
                cash_out = Decimal(player_data["cash_out"])

                total_pot = sum(Decimal(p["cash_out"]) for p in players_data)

                avg_stack = Decimal(total_pot) / Decimal(len(players_data)) if len(players_data) > 0 else Decimal(0)

                profit = cash_out - buy_in

                profit_per_hour = profit / game_duration if game_duration > 0 else Decimal(0)

                game_data = {
                    "game_date": str(game.start_time.date()),  
                    "game_duration": round(game_duration, 2),
                    "buy_in": buy_in,
                    "cash_out": cash_out,
                    "total_pot": total_pot,
                    "avg_stack": round(avg_stack, 2),
                    "profit": profit,
                    "profit_per_hour": round(profit_per_hour, 2),
                }

                send_game_summary_email.delay(player.email, game_data, transactions)

        return Response({"detail": "The game has been successfully ended and emails have been sent."}, status=status.HTTP_200_OK)

    def settle_debts(self, players_data, game):
        players = []

        for player_data in players_data:
            player_name = player_data.get('player')
            buy_in = player_data.get('buy_in', 0)
            cash_out = player_data.get('cash_out', 0)
            balance = cash_out - buy_in

            players.append({
                'username': player_name,
                'balance': balance
            })

        debtors = [p for p in players if p['balance'] < 0]
        creditors = [p for p in players if p['balance'] > 0]

        transactions = []

        while debtors and creditors:
            debtor = debtors[0]
            creditor = creditors[0]

            transaction_amount = min(-debtor['balance'], creditor['balance'])

            debtor['balance'] += transaction_amount
            creditor['balance'] -= transaction_amount

            debtor_user = User.objects.get(username=debtor['username'])
            creditor_user = User.objects.get(username=creditor['username'])

            try:
                creditor_phone = creditor_user.userprofile.phone_number
            except AttributeError:
                creditor_phone = "Brak numeru"

            Debts.objects.create(
                game=game,
                amount=Decimal(transaction_amount),
                sender=debtor_user,
                reciver=creditor_user,
                is_send=False
            )

            transactions.append({
                "game": game.code,
                "amount": float(transaction_amount),
                "sender": debtor_user.username,
                "receiver": creditor_user.username,
                "phone": creditor_phone 
            })

            if debtor['balance'] == 0:
                debtors.pop(0)
            if creditor['balance'] == 0:
                creditors.pop(0)

        return transactions



class UserStatsView(APIView):
    """Retrieves statistics related to the logged-in user, including earnings and performance metrics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stats = Statistics.objects.filter(player_to_game__player=user).aggregate(
            total_earn=Sum(F('cash_out') - F('buy_in')),
            highest_win=Max(F('cash_out') - F('buy_in')),
            total_buy_in=Sum('buy_in'),
            total_cash_out=Sum('cash_out'),
            average_stake=Avg('buy_in'),
        )

        games = Game.objects.filter(players__player=user).annotate(
            duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
        )

        total_play_time = games.aggregate(total_time=Sum('duration'))['total_time'] or timedelta()
        total_hours_played = Decimal(total_play_time.total_seconds() / 3600)
        total_earn = stats['total_earn'] or Decimal(0)
        highest_win = stats['highest_win'] or Decimal(0)
        total_buy_in = stats['total_buy_in'] or Decimal(0)
        total_cash_out = stats['total_cash_out'] or Decimal(0)
        average_stake = stats['average_stake'] or Decimal(0)
        win_rate = (total_cash_out / total_buy_in) if total_buy_in else Decimal(0)
        hourly_rate = (total_earn / total_hours_played) if total_hours_played else Decimal(0)
        games_played = PlayerToGame.objects.filter(player=user).count()

        data = {
            'earn': round(total_earn, 2),
            'games_played': games_played,
            'total_play_time': round(total_hours_played, 2),
            'hourly_rate': round(hourly_rate, 2),
            'highest_win': round(highest_win, 2),
            'average_stake': round(average_stake, 2),
            'win_rate': round(win_rate, 2),
            'total_buyin': round(total_buy_in, 2),
        }

        serializer = UserStatsSerializer(data)
        return Response(serializer.data)



class DebtSettlementView(APIView):
    """Retrieves the list of outstanding debts for the authenticated user.
    
    This includes:
    - Debts the user must send (outgoing debts).
    - Debts the user must accept after receiving payment (incoming debts).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Retrieve debts where the user is the sender (not yet sent)
        outgoing_debts = Debts.objects.filter(
            sender=user, is_send=False, is_accepted=False
        ).select_related('reciver__userprofile', 'game').values(
            'id', 'reciver__username', 'reciver__userprofile__phone_number', 'amount', 'game__start_time'
        )

        # Retrieve debts where the user is the receiver (sent but not accepted)
        incoming_debts = Debts.objects.filter(
            reciver=user, is_send=True, is_accepted=False
        ).select_related('sender__userprofile', 'game').values(
            'id', 'sender__username', 'sender__userprofile__phone_number', 'amount', 'game__start_time'
        )

        outgoing = [
            {
                'id': debt['id'],
                'to': debt['reciver__username'],
                'from': user.username,
                'money': debt['amount'],
                'phone_number': debt['reciver__userprofile__phone_number'],
                'type': 'outgoing',
                'game_date': debt['game__start_time'].strftime('%d-%m-%Y') if debt['game__start_time'] else None
            }
            for debt in outgoing_debts
        ]

        incoming = [
            {
                'id': debt['id'],
                'to': user.username,
                'from': debt['sender__username'],
                'money': debt['amount'],
                'phone_number': debt['sender__userprofile__phone_number'],
                'type': 'incoming',
                'game_date': debt['game__start_time'].strftime('%d-%m-%Y') if debt['game__start_time'] else None
            }
            for debt in incoming_debts
        ]

        return Response(outgoing + incoming)


class SendDebtView(APIView):
    """Marks a debt as sent by the authenticated user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, debt_id):
        user = request.user
        debt = get_object_or_404(Debts, id=debt_id, sender=user, is_send=False)

        # Mark debt as sent
        debt.is_send = True
        debt.send_date = timezone.now()
        debt.save()

        return Response({"detail": "Debt sent successfully!"}, status=status.HTTP_200_OK)


class AcceptDebtView(APIView):
    """Marks a debt as accepted by the authenticated user after receiving payment."""

    permission_classes = [IsAuthenticated]

    def post(self, request, debt_id):
        user = request.user
        debt = get_object_or_404(Debts, id=debt_id, reciver=user, is_send=True, is_accepted=False)

        # Mark debt as accepted
        debt.is_accepted = True
        debt.accept_date = timezone.now()
        debt.save()

        return Response({"detail": "Debt accepted successfully!"}, status=status.HTTP_200_OK)


class UserPlotDataView(APIView):
    """Generates statistical data for the authenticated user to visualize game performance.

    This view returns:
    - Labels: Dates of game results.
    - Single game results: Profit/loss for each game.
    - Cumulative results: Accumulated earnings over time.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Retrieve statistics for the user, ordered by cash-out time
        stats = Statistics.objects.filter(player_to_game__player=user).order_by('cash_out_time')

        # Data for visualization
        labels = []
        single_game_results = []
        cumulative_results = []
        cumulative_sum = 0  # To track total cumulative earnings

        # Process each game record
        for stat in stats:
            date = stat.cash_out_time.date()
            result = stat.cash_out - stat.buy_in  # Profit or loss

            labels.append(date)
            single_game_results.append(result)

            # Update cumulative total
            cumulative_sum += result
            cumulative_results.append(cumulative_sum)

        return Response({
            'labels': labels,
            'single_game_results': single_game_results,
            'cumulative_results': cumulative_results,
        })
