from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, GameSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser  # Importowanie klas uprawnień
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied, NotFound
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


# CreateUserView, jak już było
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Dostęp dla wszystkich użytkowników


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]  # Upewnij się, że użytkownik jest zalogowany

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })


# MyTokenObtainPairView, jak już było
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

# Obiektowy widok do sprawdzania statusu superużytkownika
class CheckSuperuserStatusView(APIView):
    permission_classes = [IsAuthenticated]  # Tylko dla zalogowanych użytkowników

    def get(self, request):
        # Sprawdzamy, czy użytkownik jest superużytkownikiem
        is_superuser = request.user.is_superuser
        return Response({'is_superuser': is_superuser})
    

# Widok do tworzenia nowej gry za pomocą POST
class GameCreateView(generics.CreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAdminUser]  # Tylko superużytkownicy mogą tworzyć gry

    def perform_create(self, serializer):
        # Zapisujemy nową grę, przypisując twórcę (creator) jako zalogowanego użytkownika
        game = serializer.save(creator=self.request.user)

        # Po stworzeniu gry, przypiszmy twórcę gry do tej gry jako gracza
        PlayerToGame.objects.create(player=self.request.user, game=game)

        # Zwracamy kod gry w odpowiedzi
        self.game_code = game.code

    def post(self, request, *args, **kwargs):
        # Nadpisanie metody post, aby zwrócić kod gry po utworzeniu
        response = super().post(request, *args, **kwargs)
        return Response({"code": self.game_code}, status=status.HTTP_201_CREATED)


# Widok do dołączania do gry na podstawie kodu gry
class JoinGameView(APIView):
    permission_classes = [IsAuthenticated]  # Tylko zalogowani użytkownicy mogą dołączyć

    def post(self, request, *args, **kwargs):
        room_code = request.data.get('room_code')  # Pobierz kod gry z żądania
        user = request.user

        # Spróbuj znaleźć grę na podstawie kodu
        try:
            game = Game.objects.get(code=room_code)
        except Game.DoesNotExist:
            raise NotFound("Nie znaleziono gry o podanym kodzie.")

        # Sprawdź, czy użytkownik nie jest już przypisany do tej gry
        if PlayerToGame.objects.filter(player=user, game=game).exists():
            return Response({"detail": "Już dołączono do tej gry."}, status=status.HTTP_400_BAD_REQUEST)

        # Dodaj użytkownika do gry
        PlayerToGame.objects.create(player=user, game=game)

        return Response({"detail": "Dołączono do gry!"}, status=status.HTTP_200_OK)


# Widok zwracający listę graczy i ich stacki w grze
class PlayerListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]  # Wszyscy zalogowani mogą uzyskać dostęp, ale zakres danych będzie różny

    def get(self, request, game_code, *args, **kwargs):
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            return Response({"detail": "Gra nie istnieje"}, status=404)

        # Superużytkownicy widzą wszystkich graczy, zwykli użytkownicy tylko siebie
        if request.user.is_superuser:
            players = PlayerToGame.objects.filter(game=game)
        else:
            players = PlayerToGame.objects.filter(game=game, player=request.user)

        # Dla każdego gracza obliczamy stack
        player_data = []
        for player in players:
            actions = Action.objects.filter(player_to_game=player)

            # Oblicz sumę multiplier * buyin dla danego gracza, lub ustaw na 0 jeśli nie ma akcji
            stack_sum = actions.aggregate(
                total_stack=Coalesce(Sum(F('multiplier') * F('player_to_game__game__buy_in')), 0)
            )['total_stack']

            player_data.append({
                'name': player.player.username,
                'stack': stack_sum
            })

        # Zwracamy listę graczy (dla superużytkownika) lub dane jednego gracza (dla zwykłego użytkownika)
        return Response({
            'players': player_data,
            'buy_in': game.buy_in  # Dodajemy buy_in gry do odpowiedzi
        })
    
class PlayerActionView(APIView):
    permission_classes = [IsAuthenticated]  # Każdy zalogowany użytkownik ma dostęp

    def post(self, request, game_code, *args, **kwargs):
        action_type = request.data.get('action')  # Spodziewamy się "rebuy" lub "back"
        player_username = request.data.get('username')  # Nick gracza
        user = request.user

        # Znajdź grę na podstawie kodu
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            raise NotFound("Nie znaleziono gry o podanym kodzie.")

        # Znajdź gracza po nazwie użytkownika (nicku)
        try:
            player_to_game = PlayerToGame.objects.get(player__username=player_username, game=game)
        except PlayerToGame.DoesNotExist:
            raise NotFound(f"Gracz '{player_username}' nie jest przypisany do tej gry.")

        # Obsługa akcji "rebuy" - dostępna dla każdego
        if action_type == 'rebuy':
            Action.objects.create(player_to_game=player_to_game, multiplier=1)
            return Response({"detail": f"Rebuy dodany dla {player_to_game.player.username}!"}, status=status.HTTP_200_OK)

        # Obsługa akcji "back" - dostępna tylko dla superużytkowników
        elif action_type == 'back':
            if not user.is_superuser:
                raise PermissionDenied("Tylko superużytkownicy mogą cofnąć rebuy.")

            # Znajdź ostatni rekord akcji i usuń go
            last_action = Action.objects.filter(player_to_game=player_to_game).order_by('-action_time').first()
            if last_action:
                last_action.delete()
                return Response({"detail": f"Ostatni rebuy cofnięty dla {player_to_game.player.username}!"}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": f"Gracz {player_to_game.player.username} nie ma akcji do cofnięcia."}, status=status.HTTP_400_BAD_REQUEST)

        # W przypadku nieznanej akcji
        return Response({"detail": "Nieznany typ akcji."}, status=status.HTTP_400_BAD_REQUEST)
    
class CheckPlayerInGameView(APIView):
    permission_classes = [IsAuthenticated]  # Tylko zalogowani użytkownicy mają dostęp

    def get(self, request, game_code):
        # Sprawdzamy, czy gra istnieje
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            raise NotFound("Gra nie została znaleziona")

        # Sprawdzamy, czy gra jest zakończona
        if game.is_end:
            return Response({'is_in_game': False, 'is_game_ended': True}, status=200)

        # Sprawdzamy, czy użytkownik jest przypisany do gry
        is_in_game = PlayerToGame.objects.filter(player=request.user, game=game).exists()

        # Zwracamy informację o przypisaniu użytkownika do gry i o zakończeniu gry
        return Response({'is_in_game': is_in_game, 'is_game_ended': False}, status=200)


class GameDataView(APIView):
    permission_classes = [IsAuthenticated]  # Tylko zalogowani użytkownicy mogą uzyskać dostęp do danych

    def get(self, request, game_code):
        try:
            # Znajdź grę na podstawie kodu gry
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            return Response({"detail": "Gra nie została znaleziona"}, status=status.HTTP_404_NOT_FOUND)

        # Sprawdź, czy użytkownik jest przypisany do gry
        is_player_in_game = PlayerToGame.objects.filter(player=request.user, game=game).exists()

        if not is_player_in_game:
            # Jeśli użytkownik nie jest przypisany do gry, zwróć błąd 403 (Forbidden)
            raise PermissionDenied("Nie masz dostępu do tej gry.")

        # Pobieranie danych o grze, jeśli użytkownik jest przypisany do gry
        blinds = game.blind
        game_start_time = game.start_time

        # Pobieranie liczby graczy
        number_of_players = PlayerToGame.objects.filter(game=game).count()

        # Pobieranie wszystkich akcji graczy i obliczanie sumy
        total_money_on_table = Action.objects.filter(player_to_game__game=game).aggregate(
            total=Sum(F('multiplier') * F('player_to_game__game__buy_in'))
        )['total'] or 0  # Jeśli brak akcji, ustaw na 0

        # Obliczanie średniego stacka
        avg_stack = total_money_on_table / number_of_players if number_of_players > 0 else 0

        # Zwracamy dane gry
        return Response({
            'blinds': blinds,
            'game_start_time': game_start_time,
            'money_on_table': total_money_on_table,
            'number_of_players': number_of_players,
            'avg_stack': avg_stack
        }, status=status.HTTP_200_OK)
    

class GameAdditionalDataView(APIView):
    permission_classes = [IsAuthenticated]  # Tylko zalogowani użytkownicy mogą uzyskać dostęp

    def get(self, request, game_code):
        try:
            game = Game.objects.get(code=game_code)
        except Game.DoesNotExist:
            return Response({"detail": "Gra nie została znaleziona"}, status=status.HTTP_404_NOT_FOUND)

        # Sprawdzenie, czy użytkownik jest przypisany do gry
        is_player_in_game = PlayerToGame.objects.filter(player=request.user, game=game).exists()

        if not is_player_in_game:
            # Jeśli użytkownik nie jest przypisany do gry, zwróć błąd 403 (Forbidden)
            raise PermissionDenied("Nie masz dostępu do tej gry.")

        # Zwracanie dodatkowych danych o grze
        return Response({
            'buy_in': game.buy_in,
            'blinds': game.blind,
            'how_many_plo': game.how_many_plo,
            'how_often_stand_up': game.how_often_stand_up,
            'is_poker_jackpot': game.is_poker_jackpot,
            'is_win_27': game.is_win_27,
        }, status=status.HTTP_200_OK)



class EndGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, game_code, *args, **kwargs):
        # Sprawdzenie czy użytkownik jest superuserem
        if not request.user.is_superuser:
            raise PermissionDenied("Tylko superużytkownicy mogą zakończyć grę.")

        # Pobieranie gry
        game = get_object_or_404(Game, code=game_code)

        # Pobieranie danych graczy z żądania
        players_data = request.data.get('players', [])
        
        if not players_data:
            return Response({"detail": "Brak danych graczy."}, status=status.HTTP_400_BAD_REQUEST)

        # Tworzenie statystyk dla każdego gracza
        for player_data in players_data:
            player_name = player_data.get('player')
            buy_in = player_data.get('buy_in', 0)
            cash_out = player_data.get('cash_out', 0)

            # Znajdź gracza w tabeli User
            try:
                player = User.objects.get(username=player_name)
            except User.DoesNotExist:
                return Response({"detail": f"Gracz {player_name} nie istnieje."}, status=status.HTTP_404_NOT_FOUND)

            # Znajdź PlayerToGame
            player_to_game = PlayerToGame.objects.filter(player=player, game=game).first()

            if not player_to_game:
                return Response({"detail": f"Gracz {player_name} nie bierze udziału w tej grze."}, status=status.HTTP_404_NOT_FOUND)

            # Zapisz dane w tabeli Statistics
            Statistics.objects.create(
                player_to_game=player_to_game,
                buy_in=Decimal(buy_in),
                cash_out=Decimal(cash_out),
                cash_out_time=timezone.now()
            )

        # Wywołanie funkcji do rozliczania długów
        self.settle_debts(players_data, game)


        # Oznacz grę jako zakończoną
        game.is_end = True
        game.end_time = timezone.now()

        # Oblicz różnicę czasu między startem a zakończeniem gry
        time_diff = game.end_time - game.start_time

        # Zapisz czas gry jako timedelta w game_time
        game.game_time = time_diff

        

        game.save()

        return Response({"detail": "Gra zakończona pomyślnie."}, status=status.HTTP_200_OK)

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