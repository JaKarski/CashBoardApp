from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame, Action
from django.urls import reverse
from unittest.mock import patch

class GameDataViewTest(APITestCase):

    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Create a game
        self.game = Game.objects.create(
            code="GAME123",
            buy_in=100,
            blind=0.5,
            start_time="2024-12-28T00:00:00Z",
            creator=self.user1
        )

        # Add user1 to the game
        self.player_to_game = PlayerToGame.objects.create(player=self.user1, game=self.game)

        # Create an action for user1
        self.action = Action.objects.create(player_to_game=self.player_to_game, multiplier=2)

        # Endpoint for GameDataView
        self.url = reverse('game-data', args=['GAME123'])

    def authenticate(self, user):
        # Authenticate the given user
        self.client.force_authenticate(user=user)

    def test_get_game_data_success(self):
        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('blinds', response.data)
        self.assertIn('money_on_table', response.data)
        self.assertEqual(response.data['blinds'], '0.50')
        self.assertEqual(response.data['money_on_table'], 200)

    def test_get_game_data_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_game_data_user_not_in_game(self):
        self.authenticate(self.user2)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "You do not have access to this game.")

    def test_get_game_data_game_not_found(self):
        self.authenticate(self.user1)

        invalid_url = reverse('game-data', args=['INVALID'])
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Game not found")

    @patch('api.models.Action.objects.filter')
    def test_get_game_data_no_actions(self, mock_filter):
        mock_filter.return_value.aggregate.return_value = {'total': 0}
        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['money_on_table'], 0)
        self.assertEqual(response.data['avg_stack'], 0)
