from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, GameSerializer, PlayerToGameSerializer, PlayerActionSerializer, GameDataSerializer, GameAdditionalDataSerializer, PlayerDataSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Game, PlayerToGame, Action, Statistics, Debts
from django.db.models import Sum, F
from django.db.models import Sum, Max, F, ExpressionWrapper, DecimalField
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from decimal import Decimal
from datetime import datetime, timedelta
from django.db import transaction


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(APIView):
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_superuser = request.user.is_superuser
        return Response({'is_superuser': is_superuser})


class GameCreateView(generics.CreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAdminUser]  # Only admin users can create games

    def perform_create(self, serializer):
        with transaction.atomic():
            # Save the new game and set the creator as the logged-in user
            game = serializer.save(creator=self.request.user)

            # Assign the creator to the game as a player
            PlayerToGame.objects.create(player=self.request.user, game=game)

            # Store the game code to return in the response
            self.game_code = game.code

    def post(self, request, *args, **kwargs):
        # Override the POST method to include the game code in the response
        response = super().post(request, *args, **kwargs)
        return Response({"code": self.game_code}, status=status.HTTP_201_CREATED)


class JoinGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')
        if not room_code:
            raise ValidationError({"room_code": "This field is required."})

        try:
            game = Game.objects.get(code=room_code)
        except Game.DoesNotExist:
            raise NotFound("The game with the specified code was not found.")

        # Check if the game is already ended
        if game.is_end:
            raise PermissionDenied("Cannot join a game that has already ended.")

        user = request.user
        if PlayerToGame.objects.filter(player=user, game=game).exists():
            return Response({"detail": "Already attached to this game."}, status=status.HTTP_400_BAD_REQUEST)

        PlayerToGame.objects.create(player=user, game=game)
        return Response({"detail": "Included in the game!"}, status=status.HTTP_200_OK)


class PlayerListView(generics.ListAPIView):
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
            'players': serializer.data,  # Dane graczy
            'buy_in': game.buy_in  # Dodajemy buy_in do odpowiedzi
        })


class PlayerActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, game_code, *args, **kwargs):
        serializer = PlayerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_type = serializer.validated_data['action']
        player_username = serializer.validated_data['username']
        user = request.user

        # Manual validation of action type
        if action_type not in ['rebuy', 'back']:
            return Response({"detail": "Unknown action type."}, status=status.HTTP_400_BAD_REQUEST)

        # Find the game
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            raise NotFound("Game not found.")

        # Find the player in the game
        try:
            player_to_game = PlayerToGame.objects.select_related('player', 'game').get(
                player__username=player_username, game=game
            )
        except PlayerToGame.DoesNotExist:
            raise NotFound(f"Player '{player_username}' is not associated with this game.")

        # Handle rebuy action
        if action_type == 'rebuy':
            return self.handle_rebuy(player_to_game)

        # Handle back action
        elif action_type == 'back':
            if not user.is_superuser:
                raise PermissionDenied("Only superusers can undo a rebuy.")
            return self.handle_back(player_to_game)

    def handle_rebuy(self, player_to_game):
        Action.objects.create(player_to_game=player_to_game, multiplier=1)
        return Response({"detail": f"Rebuy added for {player_to_game.player.username}!"}, status=status.HTTP_200_OK)

    def handle_back(self, player_to_game):
        last_action = Action.objects.filter(player_to_game=player_to_game).order_by('-action_time').first()
        if last_action:
            last_action.delete()
            return Response({"detail": f"The last rebuy was undone for {player_to_game.player.username}!"}, status=status.HTTP_200_OK)
        return Response({"detail": f"Player {player_to_game.player.username} has no actions to undo."}, status=status.HTTP_400_BAD_REQUEST)


class CheckPlayerInGameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_code):
        # Check if the game exists
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            raise NotFound("Game not found.")

        # Check if the game is finished
        if game.is_end:
            return Response(
                {
                    'is_in_game': False,
                    'is_game_ended': True,
                    'game_code': game_code,
                },
                status=status.HTTP_410_GONE,  # Game is finished
            )

        # Check if the user is assigned to the game
        is_in_game = PlayerToGame.objects.filter(player=request.user, game=game).exists()

        # Return information about the user's participation in the game and game status
        return Response(
            {
                'is_in_game': is_in_game,
                'is_game_ended': False,
                'game_code': game_code,
            },
            status=status.HTTP_200_OK,
        )


class GameDataView(APIView):
    permission_classes = [IsAuthenticated]  # Only authenticated users can access the data

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
    permission_classes = [IsAuthenticated]

    def get(self, request, game_code):
        try:
            # Use the proper related_name to filter
            game = Game.objects.filter(code=game_code, players__player=request.user).distinct().get()
        except Game.DoesNotExist:
            raise PermissionDenied("You do not have access to this game or the game does not exist.")

        serializer = GameAdditionalDataSerializer(game)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EndGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, game_code, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can end the game.")

        game = get_object_or_404(Game, code=game_code)
        serializer = PlayerDataSerializer(data=request.data.get('players', []), many=True)
        serializer.is_valid(raise_exception=True)

        players_data = serializer.validated_data

        # Check for empty list of players
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

        self.settle_debts(players_data, game)
        game.is_end = True
        game.end_time = timezone.now()
        game.game_time = game.end_time - game.start_time
        game.save()

        return Response({"detail": "The game has been successfully ended."}, status=status.HTTP_200_OK)



    def settle_debts(self, players_data, game):
        # Przygotowanie listy graczy z saldami
        players = []

        for player_data in players_data:
            player_name = player_data.get('player')
            buy_in = player_data.get('buy_in', 0)
            cash_out = player_data.get('cash_out', 0)

            # Obliczenie salda (wygrane - buy-in)
            balance = cash_out - buy_in

            players.append({
                'username': player_name,
                'balance': balance
            })

        # Podziel graczy na dłużników i wierzycieli
        debtors = [p for p in players if p['balance'] < 0]
        creditors = [p for p in players if p['balance'] > 0]

        # Tworzenie transakcji
        while debtors and creditors:
            debtor = debtors[0]
            creditor = creditors[0]

            # Kwota transakcji to mniejsza z wartości długu i kredytu
            transaction_amount = min(-debtor['balance'], creditor['balance'])

            # Zaktualizowanie sald
            debtor['balance'] += transaction_amount
            creditor['balance'] -= transaction_amount

            # Znalezienie użytkowników w tabeli User
            debtor_user = User.objects.get(username=debtor['username'])
            creditor_user = User.objects.get(username=creditor['username'])

            # Zapisanie długów w tabeli Debts
            Debts.objects.create(
                game=game,
                amount=Decimal(transaction_amount),
                sender=debtor_user,
                reciver=creditor_user,
                is_send=False
            )

            # Usuń graczy z listy jeśli saldo wynosi 0
            if debtor['balance'] == 0:
                debtors.pop(0)
            if creditor['balance'] == 0:
                creditors.pop(0)


#before
class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Pobieranie statystyk z tabeli Statistics
        stats = Statistics.objects.filter(player_to_game__player=user)

        # Earn - Suma cash_out - buy_in
        total_earn = stats.aggregate(total_earn=Sum(F('cash_out') - F('buy_in')))['total_earn'] or Decimal(0)

        # Games Played - Liczba gier, w których gracz brał udział
        games_played = PlayerToGame.objects.filter(player=user).count()

        # Total Play Time - Suma czasu gry (obliczenie timedelta)
        games = Game.objects.filter(players__player=user)
        total_play_time = timedelta()

        for game in games:
            if game.end_time and game.start_time:
                total_play_time += game.end_time - game.start_time

        # Przekształcenie timedelta na godziny
        total_hours_played = Decimal(total_play_time.total_seconds() / 3600)

        # Highest Win - Największa wygrana (cash_out - buy_in)
        highest_win = stats.aggregate(highest_win=Max(F('cash_out') - F('buy_in')))['highest_win'] or Decimal(0)

        # Average Stake - Średni buy-in
        average_stake = stats.aggregate(average_stake=Sum('buy_in') / games_played)['average_stake'] or Decimal(0)

        # Win Rate - Suma buy-in / suma cash_out
        total_buy_in = stats.aggregate(total_buy_in=Sum('buy_in'))['total_buy_in'] or Decimal(0)
        total_cash_out = stats.aggregate(total_cash_out=Sum('cash_out'))['total_cash_out'] or Decimal(0)
        win_rate = (total_cash_out / total_buy_in) if total_buy_in != Decimal(0) else Decimal(0)

        # Hourly Rate - Zarobek na godzinę
        hourly_rate = (total_earn / total_hours_played) if total_hours_played > Decimal(0) else Decimal(0)

        # Total Buy-in
        total_buyin = total_buy_in

        return Response({
            'earn': round(total_earn, 2),
            'games_played': games_played,
            'total_play_time': round(total_hours_played, 2),
            'hourly_rate': round(hourly_rate, 2),
            'highest_win': round(highest_win, 2),
            'average_stake': round(average_stake, 2),
            'win_rate': round(win_rate, 2),
            'total_buyin': round(total_buyin, 2),
        })


class DebtSettlementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Pobieranie długów, gdzie użytkownik musi wysłać pieniądze (is_send=False)
        outgoing_debts = Debts.objects.filter(
            sender=user,
            is_send=False,
            is_accepted=False
        ).select_related('reciver__userprofile').values('id', 'reciver__username', 'reciver__userprofile__phone_number', 'amount')

        # Pobieranie długów, gdzie użytkownik otrzymał pieniądze, ale nie zaakceptował (is_send=True, is_accepted=False)
        incoming_debts = Debts.objects.filter(
            reciver=user,
            is_send=True,
            is_accepted=False
        ).select_related('sender__userprofile').values('id', 'sender__username', 'sender__userprofile__phone_number', 'amount')

        outgoing = [
            {
                'id': debt['id'],
                'to': debt['reciver__username'],
                'from': user.username,
                'money': debt['amount'],
                'phone_number': debt['reciver__userprofile__phone_number'],  # Dodano numer telefonu
                'type': 'outgoing'
            }
            for debt in outgoing_debts
        ]

        incoming = [
            {
                'id': debt['id'],
                'to': user.username,
                'from': debt['sender__username'],
                'money': debt['amount'],
                'phone_number': debt['sender__userprofile__phone_number'],  # Dodano numer telefonu
                'type': 'incoming'
            }
            for debt in incoming_debts
        ]

        return Response(outgoing + incoming)


class SendDebtView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, debt_id):
        user = request.user
        # Pobieranie długu
        debt = get_object_or_404(Debts, id=debt_id, sender=user, is_send=False)

        # Aktualizacja długu
        debt.is_send = True
        debt.send_date = timezone.now()
        debt.save()

        return Response({"detail": "Debt sent successfully!"}, status=status.HTTP_200_OK)


class AcceptDebtView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, debt_id):
        user = request.user
        # Pobieranie długu
        debt = get_object_or_404(Debts, id=debt_id, reciver=user, is_send=True, is_accepted=False)

        # Aktualizacja długu
        debt.is_accepted = True
        debt.accept_date = timezone.now()
        debt.save()

        return Response({"detail": "Debt accepted successfully!"}, status=status.HTTP_200_OK)


class UserPlotDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Pobieranie danych z tabeli Statistics
        stats = Statistics.objects.filter(player_to_game__player=user).order_by('cash_out_time')

        # Dane do wykresów
        labels = []
        single_game_results = []
        cumulative_results = []
        cumulative_sum = 0  # Do obliczania skumulowanych wyników

        # Iteracja przez dane statystyk
        for stat in stats:
            date = stat.cash_out_time.date()
            result = stat.cash_out - stat.buy_in  # Wynik gry (cash_out - buy_in)

            # Dodajemy datę do listy etykiet
            labels.append(date)

            # Dodajemy wynik pojedynczej gry do listy
            single_game_results.append(result)

            # Obliczanie skumulowanego wyniku
            cumulative_sum += result
            cumulative_results.append(cumulative_sum)

        return Response({
            'labels': labels,
            'single_game_results': single_game_results,
            'cumulative_results': cumulative_results,
        })
    
