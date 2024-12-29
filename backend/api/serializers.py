from django.contrib.auth.models import User
from .models import Game, PlayerToGame, UserProfile, Action
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db.models import Sum, F
from django.db.models.functions import Coalesce


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
    creator = UserSerializer(read_only=True)  # Display creator details but make it read-only
    code = serializers.CharField(read_only=True)  # Game code is auto-generated and cannot be manually set
    start_time = serializers.DateTimeField(read_only=True)  # Automatically set when the game is created

    class Meta:
        model = Game
        fields = [
            'id', 'code', 'start_time', 'buy_in', 'end_time', 'is_end', 
            'game_time', 'blind', 'how_many_plo', 'how_often_stand_up', 
            'is_poker_jackpot', 'is_win_27', 'creator'
        ]


class PlayerToGameSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='player.username', read_only=True)  # Dodajemy pole name
    stack = serializers.SerializerMethodField()  # Pole stack obliczane dynamicznie

    class Meta:
        model = PlayerToGame
        fields = ['name', 'stack']  # Wybieramy tylko potrzebne pola

    def get_stack(self, obj):
        # Obliczamy stack dla danego PlayerToGame
        actions = Action.objects.filter(player_to_game=obj)
        return actions.aggregate(
            total_stack=Coalesce(Sum(F('multiplier') * F('player_to_game__game__buy_in')), 0)
        )['total_stack']


class PlayerActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['rebuy', 'back'])
    username = serializers.CharField(max_length=150)


class GameDataSerializer(serializers.Serializer):
    blinds = serializers.CharField()
    game_start_time = serializers.DateTimeField()
    money_on_table = serializers.FloatField()
    number_of_players = serializers.IntegerField()
    avg_stack = serializers.FloatField()


class GameAdditionalDataSerializer(serializers.ModelSerializer):
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
    player = serializers.CharField()
    buy_in = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    cash_out = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)

