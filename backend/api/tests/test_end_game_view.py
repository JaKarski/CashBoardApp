from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Game, PlayerToGame, Statistics, Debts


class EndGameViewTestCase(APITestCase):

    def setUp(self):
        # Create an admin user (superuser)
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='adminpassword',
            email='admin@example.com'
        )

        # API endpoint base
        self.base_url = '/api/games/'

    def tearDown(self):
        # Clean up the database after each test case
        Game.objects.all().delete()
        PlayerToGame.objects.all().delete()
        Debts.objects.all().delete()
        Statistics.objects.all().delete()
        User.objects.exclude(username='admin').delete()  # Preserve the admin user

    def authenticate(self, user):
        # Authenticate the given user
        self.client.force_authenticate(user=user)

    def create_game_with_players(self, game_code, players_data):
        """Helper to create a game and add players."""
        game = Game.objects.create(
            creator=self.admin_user,
            code=game_code,
            start_time="2023-01-01T12:00:00Z"
        )
        for player in players_data:
            user = User.objects.create_user(username=player, password="password", email=f"{player}@example.com")
            PlayerToGame.objects.create(player=user, game=game)
        return game

    def execute_test_case(self, game_code, players_data, expected_balances):
        """Helper function to execute a single test case."""
        # Authenticate as the admin user
        self.authenticate(self.admin_user)

        # Create game and players
        game = self.create_game_with_players(game_code, [p["player"] for p in players_data])

        # Prepare game data for the request
        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')

        # Assert the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify debts were created
        debts = Debts.objects.all()

        # If all balances are zero, no debts should exist
        if all(balance == 0 for balance in expected_balances.values()):
            self.assertFalse(debts.exists(), f"Debts exist for {game_code} when no transactions should occur.")
            return  # Skip further checks

        # Otherwise, ensure debts exist
        self.assertTrue(debts.exists(), f"No debts created for {game_code} when transactions were expected.")

        # Initialize balances for all players
        actual_balances = {player['player']: expected_balances.get(player['player'], 0) for player in players_data}

        # Apply transactions to calculate final balances
        for debt in debts:
            sender = debt.sender.username
            receiver = debt.reciver.username
            amount = float(debt.amount)

            # Update balances
            actual_balances[sender] += amount
            actual_balances[receiver] -= amount

        # Ensure all final balances are zero
        for username, balance in actual_balances.items():
            self.assertAlmostEqual(balance, 0, places=2, msg=f"The final balance for {username} in {game_code} is not zero.")


    def test_case_1(self):
        """Test case with simple balances."""
        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 150},  # +50
            {"player": "player2", "buy_in": 200, "cash_out": 100},  # -100
            {"player": "player3", "buy_in": 100, "cash_out": 170},  # +70
            {"player": "player4", "buy_in": 100, "cash_out": 80}    # -20
        ]
        expected_balances = {
            "player1": 50,
            "player2": -100,
            "player3": 70,
            "player4": -20
        }
        self.execute_test_case("GAME123", players_data, expected_balances)

    def test_case_2(self):
        """Test case with no net balance changes."""
        players_data = [
            {"player": "player5", "buy_in": 300, "cash_out": 400},  # +100
            {"player": "player6", "buy_in": 200, "cash_out": 150},  # -50
            {"player": "player7", "buy_in": 150, "cash_out": 150},  # 0
            {"player": "player8", "buy_in": 100, "cash_out": 50}   # -50
        ]
        expected_balances = {
            "player5": 100,
            "player6": -50,
            "player7": 0,
            "player8": -50
        }
        self.execute_test_case("GAME456", players_data, expected_balances)

    def test_case_3(self):
        """Test case with all players breaking even."""
        players_data = [
            {"player": "player9", "buy_in": 100, "cash_out": 100},  # 0
            {"player": "player10", "buy_in": 200, "cash_out": 200}, # 0
            {"player": "player11", "buy_in": 150, "cash_out": 150}, # 0
            {"player": "player12", "buy_in": 300, "cash_out": 300}  # 0
        ]
        expected_balances = {
            "player9": 0,
            "player10": 0,
            "player11": 0,
            "player12": 0
        }
        self.execute_test_case("GAME789", players_data, expected_balances)

    def test_case_4(self):
        """Test case with 12 players and complex balances."""
        players_data = [
            {"player": "player1", "buy_in": 1000.50, "cash_out": 2075.25},  # +1074.75
            {"player": "player2", "buy_in": 2000.30, "cash_out": 1800.80},  # -199.50
            {"player": "player3", "buy_in": 300.00, "cash_out": 350.50},    # +50.50
            {"player": "player4", "buy_in": 400.00, "cash_out": 100.00},    # -300.00
            {"player": "player5", "buy_in": 700.75, "cash_out": 705.75},    # +5.00
            {"player": "player6", "buy_in": 500.00, "cash_out": 450.00},    # -50.00
            {"player": "player7", "buy_in": 100.00, "cash_out": 200.00},    # +100.00
            {"player": "player8", "buy_in": 1000.00, "cash_out": 800.00},   # -200.00
            {"player": "player9", "buy_in": 600.00, "cash_out": 620.00},    # +20.00
            {"player": "player10", "buy_in": 250.00, "cash_out": 150.00},   # -100.00
            {"player": "player11", "buy_in": 900.00, "cash_out": 950.00},   # +50.00
            {"player": "player12", "buy_in": 1500.00, "cash_out": 1049.25}  # -450.75
        ]

        # The expected balances are manually calculated
        expected_balances = {
            "player1": 1074.75,
            "player2": -199.50,
            "player3": 50.50,
            "player4": -300.00,
            "player5": 5.00,
            "player6": -50.00,
            "player7": 100.00,
            "player8": -200.00,
            "player9": 20.00,
            "player10": -100.00,
            "player11": 50.00,
            "player12": -450.75
        }

        # Execute the test case
        self.execute_test_case("GAME999", players_data, expected_balances)



    def test_statistics_creation(self):
        """Ensure statistics are created for all players."""
        players_data = [
            {"player": "player1", "buy_in": 200, "cash_out": 300},  # +100
            {"player": "player2", "buy_in": 150, "cash_out": 50},   # -100
        ]
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_S", [p["player"] for p in players_data])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that statistics were created for each player
        for player in players_data:
            user = User.objects.get(username=player["player"])
            stats = Statistics.objects.filter(player_to_game__player=user, player_to_game__game=game).first()
            self.assertIsNotNone(stats, f"Statistics not created for {user.username}.")
            self.assertEqual(stats.buy_in, player["buy_in"], f"Buy-in mismatch for {user.username}.")
            self.assertEqual(stats.cash_out, player["cash_out"], f"Cash-out mismatch for {user.username}.")

    def test_game_ended_flag(self):
        """Ensure the game is marked as ended and time is calculated."""
        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 200},
            {"player": "player2", "buy_in": 200, "cash_out": 100},
        ]
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_END", [p["player"] for p in players_data])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Reload the game object and check its status
        game.refresh_from_db()
        self.assertTrue(game.is_end, "Game should be marked as ended.")
        self.assertIsNotNone(game.end_time, "Game end time should be set.")
        self.assertIsNotNone(game.game_time, "Game time should be calculated.")
        self.assertGreater(game.game_time.total_seconds(), 0, "Game time should be greater than zero.")

    def test_missing_player_in_game(self):
        """Ensure the endpoint handles players not in the game."""
        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 150},
            {"player": "not_in_game", "buy_in": 200, "cash_out": 100},  # Player not in game
        ]
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_MIS", ["player1"])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn(
            "Some players do not exist.",
            response.data["detail"],
            "Error message should indicate missing players."
        )

    def test_non_admin_access(self):
        """Ensure non-admin users cannot end the game."""
        non_admin_user = User.objects.create_user(username='user1', password='userpassword')
        self.authenticate(non_admin_user)

        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 100},
        ]
        game = self.create_game_with_players("GAME_NOA", ["player1"])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only superusers can end the game.", str(response.data), "Error message should indicate lack of permission.")

    def test_empty_players_data(self):
        """Ensure the endpoint handles empty players data."""
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_EMP", ["player1"])

        game_data = {"players": []}  # No players data
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No player data provided.", str(response.data), "Error message should indicate missing player data.")


    def test_financial_integrity(self):
        """Ensure the endpoint validates financial integrity."""
        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 150},  # +50
            {"player": "player2", "buy_in": 200, "cash_out": 100},  # -100
            {"player": "player3", "buy_in": 150, "cash_out": 220},  # +70
        ]
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_INT", [p["player"] for p in players_data])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')

        # Expect HTTP 400 because total balance is not zero
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "The total difference between 'cash_out' and 'buy_in' must be 0.",
            str(response.data),
            "Error message should indicate financial integrity issue."
        )

    def test_financial_integrity_passes(self):
        """Ensure the endpoint allows valid financial data."""
        players_data = [
            {"player": "player1", "buy_in": 100, "cash_out": 150},  # +50
            {"player": "player2", "buy_in": 200, "cash_out": 100},  # -100
            {"player": "player3", "buy_in": 150, "cash_out": 200},  # +50
            {"player": "player4", "buy_in": 50, "cash_out": 50},    # 0
        ]
        self.authenticate(self.admin_user)
        game = self.create_game_with_players("GAME_VAL", [p["player"] for p in players_data])

        game_data = {"players": players_data}
        url = f'{self.base_url}{game.code}/end-game/'

        # Send a POST request to end the game
        response = self.client.post(url, game_data, format='json')

        # Expect HTTP 200 because total balance is zero
        self.assertEqual(response.status_code, status.HTTP_200_OK)


