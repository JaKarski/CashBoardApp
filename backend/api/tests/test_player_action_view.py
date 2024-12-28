from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame, Action
from django.urls import reverse


class PlayerActionViewTest(APITestCase):

    def setUp(self):
        # Create users
        self.superuser = User.objects.create_superuser(username="superuser", password="password123")
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Create game
        self.game = Game.objects.create(
            code="GAME123",
            buy_in=100,
            blind=5,
            creator=self.superuser
        )

        # Associate users with the game
        self.player1 = PlayerToGame.objects.create(player=self.user1, game=self.game)
        self.player2 = PlayerToGame.objects.create(player=self.user2, game=self.game)

        # API endpoint
        self.url = reverse('player-action', kwargs={'game_code': self.game.code})

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_rebuy_action_success(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"action": "rebuy", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Rebuy added for user1!")

        # Check that the action was created
        self.assertTrue(Action.objects.filter(player_to_game=self.player1, multiplier=1).exists())

    def test_rebuy_action_user_not_in_game(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"action": "rebuy", "username": "user_not_in_game"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Player 'user_not_in_game' is not associated with this game.")

    def test_rebuy_action_unauthenticated(self):
        response = self.client.post(self.url, {"action": "rebuy", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_back_action_success(self):
        self.authenticate(self.superuser)

        # Create a rebuy action
        Action.objects.create(player_to_game=self.player1, multiplier=1)

        response = self.client.post(self.url, {"action": "back", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "The last rebuy was undone for user1!")

        # Check that the action was removed
        self.assertFalse(Action.objects.filter(player_to_game=self.player1).exists())

    def test_back_action_no_actions_to_undo(self):
        self.authenticate(self.superuser)

        response = self.client.post(self.url, {"action": "back", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Player user1 has no actions to undo.")

    def test_back_action_not_superuser(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"action": "back", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "Only superusers can undo a rebuy.")

    def test_invalid_action_type(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"action": "invalid_action", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Assert the specific error returned by the serializer
        self.assertIn("action", response.data)
        self.assertEqual(
            response.data["action"][0], 
            '"invalid_action" is not a valid choice.'
        )

    def test_missing_action_field(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("action", response.data)

    def test_missing_username_field(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url, {"action": "rebuy"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_game_not_found(self):
        self.authenticate(self.user1)

        url = reverse('player-action', kwargs={'game_code': "INVALID"})
        response = self.client.post(url, {"action": "rebuy", "username": "user1"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Game not found.")
