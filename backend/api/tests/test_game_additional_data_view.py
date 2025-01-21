from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame
from django.urls import reverse


class GameAdditionalDataViewTest(APITestCase):

    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Create a game
        self.game = Game.objects.create(
            code="GAME123",
            buy_in=200,
            blind=1,
            how_many_plo=3,
            how_often_stand_up=2,
            is_poker_jackpot=True,
            is_win_27=False,
            creator=self.user1  # Assigning a creator for the game
        )

        # Add user1 to the game
        self.player_to_game = PlayerToGame.objects.create(player=self.user1, game=self.game)

        # Endpoint for GameAdditionalDataView
        self.url = reverse('game-additional-data', args=['GAME123'])

    def authenticate(self, user):
        """Helper method to authenticate a user."""
        self.client.force_authenticate(user=user)

    def test_get_game_additional_data_success(self):
        """Test retrieving game data when the user is part of the game."""
        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('buy_in', response.data)
        self.assertIn('blind', response.data)
        self.assertEqual(response.data['buy_in'], 200)
        self.assertEqual(response.data['blind'], 1.0)
        self.assertEqual(response.data['how_many_plo'], 3)
        self.assertEqual(response.data['how_often_stand_up'], 2)
        self.assertEqual(response.data['is_poker_jackpot'], True)
        self.assertEqual(response.data['is_win_27'], False)

    def test_get_game_additional_data_unauthenticated(self):
        """Test accessing game data without authentication."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_game_additional_data_user_not_in_game(self):
        """Test retrieving game data when the user is not part of the game."""
        self.authenticate(self.user2)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "You do not have access to this game or the game does not exist.")

    def test_get_game_additional_data_game_not_found(self):
        """Test retrieving game data for a non-existent game."""
        self.authenticate(self.user1)

        invalid_url = reverse('game-additional-data', args=['INVALID'])
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "You do not have access to this game or the game does not exist.")
