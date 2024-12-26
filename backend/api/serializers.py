from django.contrib.auth.models import User
from .models import Game, PlayerToGame, UserProfile
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True, required=True)  # Now it's required

    class Meta:
        model = User
        fields = ["id", "username", "password", "email", "first_name", "last_name", "phone_number"]
        extra_kwargs = {
            "username": {"required": True},
            "password": {"write_only": True, "required": True},
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate_email(self, value):
        """
        Check if the email is unique.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_username(self, value):
        """
        Check if the username is unique.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        """
        Check the strength of the password.
        """
        try:
            validate_password(value)  # Use Django's built-in password validation
        except Exception as e:
            raise serializers.ValidationError(" ".join(e.messages))  # Return all validation error messages
        return value

    def create(self, validated_data):
        """
        Create a new user and their profile (if phone_number is provided).
        """
        phone_number = validated_data.pop('phone_number')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)  # Securely set the user's password
        user.save()

        # Create a user profile
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