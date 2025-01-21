from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame


class GameCreateViewTestCase(APITestCase):

    def setUp(self):
        # Create an admin user (superuser)
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='adminpassword',
            email='admin@example.com'
        )

        # Create a regular user
        self.regular_user = User.objects.create_user(
            username='user',
            password='userpassword',
            email='user@example.com'
        )

        # API endpoint for game creation
        self.url = '/api/games/create/' 

    def authenticate(self, user):
        # Authenticate the given user
        self.client.force_authenticate(user=user)

    def test_create_game_as_admin(self):
        # Authenticate as the admin user
        self.authenticate(self.admin_user)

        # Data for the game creation
        game_data = {
            'buy_in': 100,
            'is_end': False,
            'blind': 5,
            'how_many_plo': 2,
            'how_often_stand_up': 15,
            'is_poker_jackpot': True,
            'is_win_27': False
        }

        # Send a POST request to create a game
        response = self.client.post(self.url, game_data)

        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('code', response.data)  # Check if the game code is in the response

        # Verify the game was created with the correct creator
        game = Game.objects.get(code=response.data['code'])
        self.assertEqual(game.creator, self.admin_user)

        # Verify the admin user is added as a player
        self.assertTrue(PlayerToGame.objects.filter(player=self.admin_user, game=game).exists())

    def test_create_game_as_regular_user(self):
        # Authenticate as a regular user
        self.authenticate(self.regular_user)

        # Data for the game creation
        game_data = {
            'buy_in': 100,
            'is_end': False,
            'blind': 5,
            'how_many_plo': 2,
            'how_often_stand_up': 15,
            'is_poker_jackpot': True,
            'is_win_27': False
        }

        # Send a POST request to create a game
        response = self.client.post(self.url, game_data)

        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)  # Regular users cannot create games

    def test_game_creation_requires_authentication(self):
        # Data for the game creation
        game_data = {
            'buy_in': 100,
            'is_end': False,
            'blind': 5,
            'how_many_plo': 2,
            'how_often_stand_up': 15,
            'is_poker_jackpot': True,
            'is_win_27': False
        }

        # Send a POST request without authentication
        response = self.client.post(self.url, game_data)

        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  # Authentication is required
