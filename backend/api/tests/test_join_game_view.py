from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame
from django.urls import reverse

class JoinGameViewTest(APITestCase):

    def setUp(self):
        # Tworzenie użytkowników
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Tworzenie gry
        self.game = Game.objects.create(
            code="GAME1234",
            buy_in=100,
            blind=5,
            creator=self.user1
        )

        # Endpoint widoku
        self.url = reverse('join-game')

    def authenticate(self, user):
        # Authenticate the given user
        self.client.force_authenticate(user=user)

    def test_join_game_success(self):
        self.authenticate(self.user2)

        response = self.client.post(self.url, {"room_code": "GAME1234"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Included in the game!")

        # Sprawdzenie, czy użytkownik został dodany do gry
        self.assertTrue(PlayerToGame.objects.filter(player=self.user2, game=self.game).exists())

    def test_join_game_already_attached(self):
        PlayerToGame.objects.create(player=self.user2, game=self.game)
        self.authenticate(self.user2)

        response = self.client.post(self.url, {"room_code": "GAME1234"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Already attached to this game.")

    def test_join_game_not_found(self):
        self.authenticate(self.user2)

        response = self.client.post(self.url, {"room_code": "INVALID"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "The game with the specified code was not found.")

    def test_join_game_unauthenticated(self):
        response = self.client.post(self.url, {"room_code": "GAME1234"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_game_missing_room_code(self):
        self.authenticate(self.user2)

        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("room_code", response.data)

    def test_join_game_ended(self):
        # Ustawienie gry jako zakończonej
        self.game.is_end = True
        self.game.save()

        self.authenticate(self.user2)

        response = self.client.post(self.url, {"room_code": "GAME1234"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "Cannot join a game that has already ended.")
