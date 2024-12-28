from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame
from django.urls import reverse

class CheckPlayerInGameViewTest(APITestCase):

    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username="player", password="password123")
        self.other_user = User.objects.create_user(username="other_player", password="password123")

        # Create games with a valid creator
        self.active_game = Game.objects.create(code="ACT123", is_end=False, creator=self.user)
        self.finished_game = Game.objects.create(code="FIN123", is_end=True, creator=self.user)

        # Assign user to the active game
        PlayerToGame.objects.create(player=self.user, game=self.active_game)

        # Endpoints
        self.active_game_url = reverse('check-player-in-game', kwargs={'game_code': "ACT123"})
        self.finished_game_url = reverse('check-player-in-game', kwargs={'game_code': "FIN123"})
        self.nonexistent_game_url = reverse('check-player-in-game', kwargs={'game_code': "NONEXIST"})


    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_active_game_user_in_game(self):
        self.authenticate(self.user)
        response = self.client.get(self.active_game_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_in_game'], True)
        self.assertEqual(response.data['is_game_ended'], False)
        self.assertEqual(response.data['game_code'], "ACT123")

    def test_active_game_user_not_in_game(self):
        self.authenticate(self.other_user)
        response = self.client.get(self.active_game_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_in_game'], False)
        self.assertEqual(response.data['is_game_ended'], False)
        self.assertEqual(response.data['game_code'], "ACT123")

    def test_finished_game(self):
        self.authenticate(self.user)
        response = self.client.get(self.finished_game_url)

        self.assertEqual(response.status_code, status.HTTP_410_GONE)
        self.assertEqual(response.data['is_in_game'], False)
        self.assertEqual(response.data['is_game_ended'], True)
        self.assertEqual(response.data['game_code'], "FIN123")

    def test_nonexistent_game(self):
        self.authenticate(self.user)
        response = self.client.get(self.nonexistent_game_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Game not found.", str(response.data))

    def test_unauthenticated_request(self):
        response = self.client.get(self.active_game_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_game_code_length_exceeds_limit(self):
        # Attempt to call the endpoint with a game code exceeding 8 characters
        invalid_game_url = reverse('check-player-in-game', kwargs={'game_code': "TOOLONGCODE"})
        self.authenticate(self.user)
        response = self.client.get(invalid_game_url)

        # Ensure the game is not found, as it exceeds the length limit
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Game not found.", str(response.data))
