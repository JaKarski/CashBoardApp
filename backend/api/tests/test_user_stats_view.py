from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame, Statistics
from decimal import Decimal
from datetime import timedelta


class UserStatsViewTestCase(APITestCase):

    def setUp(self):
        # Create a regular user and admin user
        self.user = User.objects.create_user(username="testuser", password="password")
        self.admin_user = User.objects.create_superuser(username="admin", password="adminpassword")

        # Endpoint URL
        self.url = "/api/user/stats/"

    def tearDown(self):
        # Clean up the database after each test case
        User.objects.all().delete()
        Game.objects.all().delete()
        PlayerToGame.objects.all().delete()
        Statistics.objects.all().delete()

    def authenticate(self, user):
        """Authenticate the given user."""
        self.client.force_authenticate(user=user)

    def test_requires_authentication(self):
        """Ensure authentication is required for accessing user stats."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_with_no_stats(self):
        """Ensure the endpoint handles users with no statistics."""
        self.authenticate(self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Ensure all stats are zeros
        data = response.json()
        self.assertEqual(data["earn"], '0.00')
        self.assertEqual(data["games_played"], 0)
        self.assertEqual(data["total_play_time"], '0.00')
        self.assertEqual(data["hourly_rate"], '0.00')
        self.assertEqual(data["highest_win"], '0.00')
        self.assertEqual(data["average_stake"], '0.00')
        self.assertEqual(data["win_rate"], '0.00')
        self.assertEqual(data["total_buyin"], '0.00')

    def test_admin_access(self):
        """Ensure the endpoint works for admin users."""
        self.authenticate(self.admin_user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_stats_with_data(self):
        """Ensure the endpoint returns correct stats for a user with data."""
        from django.utils.timezone import make_aware
        from datetime import datetime

        # Autoryzuj użytkownika
        self.authenticate(self.user)

        # Tworzenie danych testowych
        game1_start = make_aware(datetime.strptime("2024-01-01 10:00:00", "%Y-%m-%d %H:%M:%S"))
        game1_end = make_aware(datetime.strptime("2024-01-01 12:00:00", "%Y-%m-%d %H:%M:%S"))
        game2_start = make_aware(datetime.strptime("2024-01-02 14:00:00", "%Y-%m-%d %H:%M:%S"))
        game2_end = make_aware(datetime.strptime("2024-01-02 16:30:00", "%Y-%m-%d %H:%M:%S"))

        game1 = Game.objects.create(
            code="GAME1234",
            start_time=game1_start,
            end_time=game1_end,
            buy_in=50,
            blind=2.00,
            creator=self.user
        )
        game2 = Game.objects.create(
            code="GAME5678",
            start_time=game2_start,
            end_time=game2_end,
            buy_in=100,
            blind=5.00,
            creator=self.user
        )

        player_to_game1 = PlayerToGame.objects.create(player=self.user, game=game1)
        player_to_game2 = PlayerToGame.objects.create(player=self.user, game=game2)

        Statistics.objects.create(player_to_game=player_to_game1, buy_in=Decimal('50.00'), cash_out=Decimal('150.00'))
        Statistics.objects.create(player_to_game=player_to_game2, buy_in=Decimal('100.00'), cash_out=Decimal('250.00'))

        # Wysłanie żądania do API
        response = self.client.get(self.url)

        # Sprawdzenie odpowiedzi
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Oczekiwane wyniki
        expected_total_earn = Decimal('250.00')  # (150-50) + (250-100)
        expected_highest_win = Decimal('150.00')  # Max(150-50, 250-100)
        expected_total_buy_in = Decimal('150.00')  # 50 + 100
        expected_total_cash_out = Decimal('400.00')  # 150 + 250
        expected_average_stake = Decimal('75.00')  # Avg(50, 100)
        total_play_time_seconds = (game1.end_time - game1.start_time).total_seconds() + (game2.end_time - game2.start_time).total_seconds()
        expected_total_play_time = Decimal(total_play_time_seconds / 3600)  # 2h + 2.5h
        expected_win_rate = expected_total_cash_out / expected_total_buy_in
        expected_hourly_rate = expected_total_earn / expected_total_play_time

        # Porównanie wyników
        self.assertEqual(data["earn"], str(round(expected_total_earn, 2)))
        self.assertEqual(data["games_played"], 2)
        self.assertEqual(data["total_play_time"], str(round(expected_total_play_time, 2)))
        self.assertEqual(data["hourly_rate"], str(round(expected_hourly_rate, 2)))
        self.assertEqual(data["highest_win"], str(round(expected_highest_win, 2)))
        self.assertEqual(data["average_stake"], str(round(expected_average_stake, 2)))
        self.assertEqual(data["win_rate"], str(round(expected_win_rate, 2)))
        self.assertEqual(data["total_buyin"], str(round(expected_total_buy_in, 2)))

    def test_user_stats_with_large_data(self):
        """Ensure the endpoint handles a large number of games and statistics correctly."""
        from django.utils.timezone import make_aware
        from datetime import datetime, timedelta

        # Autoryzuj użytkownika
        self.authenticate(self.user)

        # Tworzenie danych testowych
        total_games = 100
        total_buy_in = Decimal('0.00')
        total_cash_out = Decimal('0.00')
        total_earn = Decimal('0.00')
        total_play_time_seconds = 0
        highest_win = Decimal('-999999.99')  # Start with a very low number

        for i in range(total_games):
            start_time = make_aware(datetime.strptime("2024-01-01 10:00:00", "%Y-%m-%d %H:%M:%S") + timedelta(days=i))
            end_time = start_time + timedelta(hours=2 + i % 3)  # Variable durations

            game = Game.objects.create(
                code=f"GAME{i:04}",
                buy_in=50 + i * 10,
                blind=2.00 + i * 0.5,
                creator=self.user
            )

            game.start_time = start_time
            game.end_time = end_time
            game.save()

            player_to_game = PlayerToGame.objects.create(player=self.user, game=game)

            buy_in = Decimal('50.00') + i * 10
            cash_out = Decimal('75.00') + i * 15
            Statistics.objects.create(player_to_game=player_to_game, buy_in=buy_in, cash_out=cash_out)

            total_buy_in += buy_in
            total_cash_out += cash_out
            total_earn += cash_out - buy_in
            total_play_time_seconds += (end_time - start_time).total_seconds()
            highest_win = max(highest_win, cash_out - buy_in)

        expected_average_stake = total_buy_in / total_games
        expected_total_play_time = Decimal(total_play_time_seconds / 3600)
        expected_win_rate = total_cash_out / total_buy_in
        expected_hourly_rate = total_earn / expected_total_play_time

        # Wysłanie żądania do API
        response = self.client.get(self.url)

        # Sprawdzenie odpowiedzi
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Porównanie wyników
        self.assertEqual(data["earn"], str(round(total_earn, 2)))
        self.assertEqual(data["games_played"], total_games)
        self.assertEqual(data["total_play_time"], str(round(expected_total_play_time, 2)))
        self.assertEqual(data["hourly_rate"], str(round(expected_hourly_rate, 2)))
        self.assertEqual(data["highest_win"], str(round(highest_win, 2)))
        self.assertEqual(data["average_stake"], str(round(expected_average_stake, 2)))
        self.assertEqual(data["win_rate"], str(round(expected_win_rate, 2)))
        self.assertEqual(data["total_buyin"], str(round(total_buy_in, 2)))