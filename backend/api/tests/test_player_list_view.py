from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame, Action
from django.urls import reverse
from django.db.models import F, Sum

class PlayerListViewTest(APITestCase):

    def setUp(self):
        # Tworzenie użytkowników
        self.superuser = User.objects.create_superuser(username="superuser", password="password123")
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Tworzenie gry
        self.game = Game.objects.create(
            code="GAME1234",
            buy_in=100,
            blind=5,
            creator=self.superuser
        )

        # Tworzenie relacji gracz-gra
        self.player1 = PlayerToGame.objects.create(player=self.user1, game=self.game)
        self.player2 = PlayerToGame.objects.create(player=self.user2, game=self.game)

        # Tworzenie akcji
        Action.objects.create(player_to_game=self.player1, multiplier=2)
        Action.objects.create(player_to_game=self.player2, multiplier=3)

        # Endpoint widoku
        self.url = reverse('player-list', kwargs={'game_code': self.game.code})

    def authenticate(self, user):
        # Authenticate the given user
        self.client.force_authenticate(user=user)

    def test_player_list_superuser(self):
        self.authenticate(self.superuser)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Sprawdzenie zwróconych danych
        self.assertEqual(len(response.data["players"]), 2)
        self.assertEqual(response.data["buy_in"], self.game.buy_in)

        player1_data = next(player for player in response.data["players"] if player["name"] == self.user1.username)
        player2_data = next(player for player in response.data["players"] if player["name"] == self.user2.username)

        # Sprawdzenie stacków
        self.assertEqual(player1_data["stack"], 2 * self.game.buy_in)
        self.assertEqual(player2_data["stack"], 3 * self.game.buy_in)

    def test_player_list_normal_user(self):
        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Zwykły użytkownik powinien widzieć tylko swoje dane
        self.assertEqual(len(response.data["players"]), 1)
        self.assertEqual(response.data["players"][0]["name"], self.user1.username)
        self.assertEqual(response.data["players"][0]["stack"], 2 * self.game.buy_in)

    def test_player_list_game_not_found(self):
        self.authenticate(self.superuser)

        invalid_url = reverse('player-list', kwargs={'game_code': 'INVALID'})
        response = self.client.get(invalid_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "No Game matches the given query.")

    def test_player_list_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_player_list_no_players(self):
        # Tworzymy nową grę bez graczy
        new_game = Game.objects.create(
            code="EMPTYGAM",
            buy_in=200,
            blind=10,
            creator=self.superuser
        )
        empty_game_url = reverse('player-list', kwargs={'game_code': new_game.code})
        self.authenticate(self.superuser)

        response = self.client.get(empty_game_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Powinna być pusta lista graczy
        self.assertEqual(response.data["players"], [])
        self.assertEqual(response.data["buy_in"], new_game.buy_in)
