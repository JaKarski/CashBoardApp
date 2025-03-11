from django.contrib.auth.models import User
from .models import Game, PlayerToGame, UserProfile, Action
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db.models import Sum, F
from django.db.models.functions import Coalesce


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user registration and profile creation.
    
    - Requires `phone_number` as an additional field.
    - Ensures unique email and username validation.
    - Uses Django's built-in password validation.
    """

    phone_number = serializers.CharField(write_only=True, required=True)

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
        """Ensures email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_username(self, value):
        """Ensures username uniqueness."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        """Validates password strength using Django's built-in password validators."""
        try:
            validate_password(value)
        except Exception as e:
            raise serializers.ValidationError(" ".join(e.messages))
        return value

    def create(self, validated_data):
        """Creates a new user and their profile (phone number required)."""
        phone_number = validated_data.pop('phone_number')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Create a user profile
        UserProfile.objects.create(user=user, phone_number=phone_number)

        return user


class GameSerializer(serializers.ModelSerializer):
    """Serializer for handling game creation and retrieval.
    
    - `creator`: Read-only user details.
    - `code`: Auto-generated, cannot be manually set.
    - `start_time`: Automatically assigned upon creation.
    """

    creator = UserSerializer(read_only=True)
    code = serializers.CharField(read_only=True)
    start_time = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id', 'code', 'start_time', 'buy_in', 'end_time', 'is_end', 
            'game_time', 'blind', 'how_many_plo', 'how_often_stand_up', 
            'is_poker_jackpot', 'is_win_27', 'creator'
        ]


class PlayerToGameSerializer(serializers.ModelSerializer):
    """Serializer for retrieving player data within a game.
    
    - `name`: The username of the player.
    - `stack`: The total buy-in stack dynamically calculated.
    """

    name = serializers.CharField(source='player.username', read_only=True)
    stack = serializers.SerializerMethodField()

    class Meta:
        model = PlayerToGame
        fields = ['name', 'stack']

    def get_stack(self, obj):
        """Calculates the total stack value based on actions within the game."""
        actions = Action.objects.filter(player_to_game=obj)
        return actions.aggregate(
            total_stack=Coalesce(Sum(F('multiplier') * F('player_to_game__game__buy_in')), 0)
        )['total_stack']


class PlayerActionSerializer(serializers.Serializer):
    """Serializer for handling player actions such as 'rebuy' and 'back'."""
    
    action = serializers.ChoiceField(choices=['rebuy', 'back'])
    username = serializers.CharField(max_length=150)


class GameDataSerializer(serializers.Serializer):
    """Serializer for retrieving essential game data and statistics."""
    
    blinds = serializers.CharField()
    game_start_time = serializers.DateTimeField()
    money_on_table = serializers.FloatField()
    number_of_players = serializers.IntegerField()
    avg_stack = serializers.FloatField()


class GameAdditionalDataSerializer(serializers.ModelSerializer):
    """Serializer for retrieving additional game settings and parameters."""
    
    blind = serializers.FloatField()

    class Meta:
        model = Game
        fields = [
            'buy_in',
            'blind',
            'how_many_plo',
            'how_often_stand_up',
            'is_poker_jackpot',
            'is_win_27',
        ]


class PlayerDataSerializer(serializers.Serializer):
    """Serializer for handling player data including buy-in and cash-out amounts."""
    
    player = serializers.CharField()
    buy_in = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    cash_out = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics and performance analysis.
    
    - Provides key performance indicators such as earnings, win rate, and hourly rate.
    """

    earn = serializers.DecimalField(max_digits=10, decimal_places=2)
    games_played = serializers.IntegerField()
    total_play_time = serializers.DecimalField(max_digits=10, decimal_places=2)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    highest_win = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_stake = serializers.DecimalField(max_digits=10, decimal_places=2)
    win_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_buyin = serializers.DecimalField(max_digits=10, decimal_places=2)
