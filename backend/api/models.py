from django.db import models
from django.contrib.auth.models import User
from datetime import time, datetime
import random
import string

def generate_unique_code():
    length = 8

    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if Game.objects.filter(code=code).count() == 0:
            break

    return code

def get_default_creator():
    try:
        return User.objects.get(username='karski').id  # Zwracamy ID użytkownika
    except User.DoesNotExist:
        return None  # Możesz ustawić None lub inny domyślny ID

class Game(models.Model):
    code = models.CharField(max_length=8, unique=True, default=generate_unique_code)
    start_time = models.DateTimeField(auto_now_add=True)
    buy_in = models.IntegerField(null=False, default=50)
    end_time = models.DateTimeField(null=True, blank=True)
    is_end = models.BooleanField(default=False)
    game_time = models.DurationField(null=True, blank=True)
    blind = models.DecimalField(max_digits=10, decimal_places=2, null=False, default=0)
    how_many_plo = models.IntegerField(null=False, default=0)
    how_often_stand_up = models.IntegerField(null=False, default=0)
    is_poker_jackpot = models.BooleanField(default=True)
    is_win_27 = models.BooleanField(default=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, default=get_default_creator, related_name='created_games')

    def __str__(self):
        return self.code


class PlayerToGame(models.Model):
    player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    join_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['player', 'game'], name='unique_player_game')
        ]

    def __str__(self):
        return f"{self.player.username} in {self.game.code}"
    
class Action(models.Model):
    player_to_game = models.ForeignKey(PlayerToGame, on_delete=models.CASCADE, related_name='game_player')
    action_time = models.DateTimeField(auto_now_add=True)
    multiplier = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.player_to_game.player.username} rebuys in {self.player_to_game.game.code}"
    

class Statistics(models.Model):
    player_to_game = models.ForeignKey(PlayerToGame, on_delete=models.CASCADE, related_name='statistics', null=True)
    buy_in = models.DecimalField(max_digits=10, decimal_places=2, null=False, default=0)
    cash_out = models.DecimalField(max_digits=10, decimal_places=2, null=False, default=0)
    cash_out_time = models.DateTimeField(auto_now_add=True)  # Możesz usunąć auto_now_add, jeśli chcesz ustawiać ręcznie

    def __str__(self):
        return f"{self.player_to_game.player.username} cashout for {self.cash_out} PLN"


class Debts(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="debt_to_game", null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    reciver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reciver")
    is_send = models.BooleanField(default=False)
    send_date = models.DateTimeField(null=True, blank=True)  # Zmienione na null=True, blank=True
    is_accepted = models.BooleanField(default=False)
    accept_date = models.DateTimeField(null=True, blank=True)  # Zmienione na null=True, blank=True

    def __str__(self):
        return f"{self.sender.username} needs to send {self.reciver.username} {self.amount} PLN for game {self.game.code}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)