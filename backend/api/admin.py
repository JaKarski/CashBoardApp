
# Register your models here.
from django.contrib import admin
from .models import Game, PlayerToGame, Action, Statistics, Debts, UserProfile

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('code', 'start_time', 'buy_in', 'is_end')
    list_filter = ('code', 'start_time')


@admin.register(PlayerToGame)
class PlayerGameAdmin(admin.ModelAdmin):
    list_display = ('id', 'player', 'game', 'join_time')
    list_filter = ('game__code',)
    

@admin.register(Action)
class ActionGameAdmin(admin.ModelAdmin):
    list_display = ('player_to_game', 'action_time', 'multiplier')
    list_filter = ('player_to_game__game__code',)

@admin.register(Statistics)
class StatisticsGameAdmin(admin.ModelAdmin):
    list_display = ('player_to_game', 'buy_in', 'cash_out')
    list_filter = ('player_to_game__game__code',)

@admin.register(Debts)
class DebtsGameAdmin(admin.ModelAdmin):
    list_display = ('game', 'amount', 'sender', 'reciver', 'get_phone_number')
    list_filter = ('game__start_time', 'game__code',)

    def get_phone_number(self, obj):
        return getattr(obj.reciver.userprofile, 'phone_number', 'Brak numeru')

    get_phone_number.short_description = 'Numer telefonu'



@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number')