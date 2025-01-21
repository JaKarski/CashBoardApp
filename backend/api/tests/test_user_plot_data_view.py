from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.urls import reverse
from api.models import Statistics, PlayerToGame, Game
from django.utils.timezone import now, timedelta

class UserPlotDataViewTest(APITestCase):

    def setUp(self):
        # Tworzenie użytkownika
        self.user = User.objects.create_user(username="user1", password="password123")

        # Tworzenie gry
        self.game = Game.objects.create(
            code="GAME1234",
            buy_in=100,
            blind=5,
            creator=self.user
        )

        # Tworzenie gracza w grze
        self.player_to_game = PlayerToGame.objects.create(
            player=self.user,
            game=self.game
        )

        # Tworzenie danych statystyk
        self.stats = [
            Statistics.objects.create(
                player_to_game=self.player_to_game,
                cash_out_time=now() - timedelta(days=i),
                cash_out=200 + (i * 10),
                buy_in=100 + (i * 5)
            )
            for i in range(5)
        ]

        # Endpoint widoku
        self.url = reverse('user-plot-data')

    def authenticate(self):
        # Uwierzytelnienie użytkownika
        self.client.force_authenticate(user=self.user)

    def test_get_user_plot_data_success(self):
        self.authenticate()

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Sprawdzanie struktury danych odpowiedzi
        data = response.data
        self.assertIn('labels', data)
        self.assertIn('single_game_results', data)
        self.assertIn('cumulative_results', data)

        # Sprawdzanie poprawności danych
        labels = [stat.cash_out_time.date() for stat in self.stats]
        single_game_results = [stat.cash_out - stat.buy_in for stat in self.stats]
        cumulative_results = []
        cumulative_sum = 0
        for result in single_game_results:
            cumulative_sum += result
            cumulative_results.append(cumulative_sum)

        self.assertEqual(data['labels'], labels)
        self.assertEqual(data['single_game_results'], single_game_results)
        self.assertEqual(data['cumulative_results'], cumulative_results)

    def test_get_user_plot_data_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_plot_data_no_data(self):
        # Usuwamy dane statystyk
        Statistics.objects.all().delete()

        self.authenticate()

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['labels'], [])
        self.assertEqual(response.data['single_game_results'], [])
        self.assertEqual(response.data['cumulative_results'], [])
