from django.db import models
from django.contrib.auth.models import User
import random
import string


def generate_unique_code():
    """Generates a unique 8-character game code consisting of uppercase letters."""
    length = 8

    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if not Game.objects.filter(code=code).exists():
            break

    return code


def get_default_creator():
    """Returns the default creator user (if available) to assign as the game creator."""
    try:
        return User.objects.get(username='karski').id
    except User.DoesNotExist:
        return None  


class Game(models.Model):
    """Represents a poker game session.
    
    Attributes:
    - `code`: Unique identifier for the game (auto-generated).
    - `start_time`: Timestamp when the game starts.
    - `buy_in`: Initial buy-in amount for players.
    - `end_time`: Timestamp when the game ends.
    - `is_end`: Flag indicating whether the game has ended.
    - `game_time`: Duration of the game session.
    - `blind`: Small blind value.
    - `how_many_plo`: Number of Pot-Limit Omaha (PLO) rounds.
    - `how_often_stand_up`: Frequency of stand-up rounds.
    - `is_poker_jackpot`: Flag for poker jackpot eligibility.
    - `is_win_27`: Flag for a special "Win 27" condition.
    - `creator`: Reference to the user who created the game.
    """

    code = models.CharField(max_length=8, unique=True, default=generate_unique_code)
    start_time = models.DateTimeField(auto_now_add=True)
    buy_in = models.IntegerField(default=50)
    end_time = models.DateTimeField(null=True, blank=True)
    is_end = models.BooleanField(default=False)
    game_time = models.DurationField(null=True, blank=True)
    blind = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    how_many_plo = models.IntegerField(default=0)
    how_often_stand_up = models.IntegerField(default=0)
    is_poker_jackpot = models.BooleanField(default=True)
    is_win_27 = models.BooleanField(default=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, default=get_default_creator, related_name='created_games')

    def __str__(self):
        return f"Game {self.code}"


class PlayerToGame(models.Model):
    """Represents a player participating in a specific game session.

    Attributes:
    - `player`: Reference to the User.
    - `game`: Reference to the Game.
    - `join_time`: Timestamp when the player joined the game.
    """

    player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    join_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['player', 'game'], name='unique_player_game')
        ]

    def __str__(self):
        return f"{self.player.username} in Game {self.game.code}"


class Action(models.Model):
    """Represents an action taken by a player during a game.
    
    Attributes:
    - `player_to_game`: Reference to the PlayerToGame.
    - `action_time`: Timestamp when the action occurred.
    - `multiplier`: Number of rebuys or action multiplier.
    """

    player_to_game = models.ForeignKey(PlayerToGame, on_delete=models.CASCADE, related_name='game_player')
    action_time = models.DateTimeField(auto_now_add=True)
    multiplier = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.player_to_game.player.username} rebuys in Game {self.player_to_game.game.code}"


class Statistics(models.Model):
    """Stores statistical data related to a player's performance in a game.

    Attributes:
    - `player_to_game`: Reference to the PlayerToGame instance.
    - `buy_in`: Amount of money the player initially invested.
    - `cash_out`: Amount of money the player cashed out.
    - `cash_out_time`: Timestamp when the player exited the game.
    """

    player_to_game = models.ForeignKey(PlayerToGame, on_delete=models.CASCADE, related_name='statistics', null=True)
    buy_in = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_out = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_out_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_to_game.player.username} cashed out {self.cash_out} PLN"


class Debts(models.Model):
    """Represents financial transactions (debts) between players after a game.

    Attributes:
    - `game`: Reference to the game session.
    - `amount`: Debt amount.
    - `sender`: The user who owes money.
    - `receiver`: The user who should receive money.
    - `is_send`: Flag indicating whether the debt has been sent.
    - `send_date`: Timestamp when the debt was marked as sent.
    - `is_accepted`: Flag indicating whether the debt was accepted by the receiver.
    - `accept_date`: Timestamp when the debt was marked as accepted.
    """

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="debt_to_game", null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    reciver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reciver")
    is_send = models.BooleanField(default=False)
    send_date = models.DateTimeField(null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    accept_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.sender.username} owes {self.reciver.username} {self.amount} PLN for Game {self.game.code}"


class UserProfile(models.Model):
    """Stores additional user information, including phone numbers.

    Attributes:
    - `user`: One-to-one relationship with the Django `User` model.
    - `phone_number`: User's contact number (optional).
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
