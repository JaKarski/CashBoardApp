from django.contrib.auth.models import User
from .models import Game, PlayerToGame, UserProfile
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "password", "email", "first_name", "last_name", "phone_number"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        user = User.objects.create_user(**validated_data)
        
        # Tworzenie powiązanego profilu użytkownika
        if phone_number:
            UserProfile.objects.create(user=user, phone_number=phone_number)

        return user


class GameSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)  # Wyświetl dane o twórcy gry, ale nie można ich modyfikować
    code = serializers.CharField(read_only=True)  # Kod gry jest generowany automatycznie, więc nie można go podać ręcznie
    start_time = serializers.DateTimeField(read_only=True)  # Automatyczne pole ustawiane przy tworzeniu gry

    class Meta:
        model = Game
        fields = [
            'id', 'code', 'start_time', 'buy_in', 'end_time', 'is_end', 
            'game_time', 'blind', 'how_many_plo', 'how_often_stand_up', 
            'is_poker_jackpot', 'is_win_27', 'creator'
        ]

class PlayerToGameSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)  # Serializator dla gracza (player)
    game = GameSerializer(read_only=True)  # Serializator dla gry (game)
    join_time = serializers.DateTimeField(read_only=True)  # Pole automatycznie ustawiane

    class Meta:
        model = PlayerToGame
        fields = ['player', 'game', 'join_time']  # Pola, które chcemy zwrócić w odpowiedzi