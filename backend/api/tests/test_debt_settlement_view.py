from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Debts, Game
from django.urls import reverse

class DebtSettlementViewTest(APITestCase):

    def setUp(self):
        # Tworzenie użytkowników
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Tworzenie gry
        self.game = Game.objects.create(
            code="GAME1234",
            buy_in=100,
            blind=5,
            creator=self.user1
        )

        # Tworzenie długów
        self.debt_outgoing = Debts.objects.create(
            sender=self.user1,
            reciver=self.user2,
            amount=50,
            is_send=False,
            is_accepted=False,
            game=self.game
        )

        self.debt_incoming = Debts.objects.create(
            sender=self.user2,
            reciver=self.user1,
            amount=30,
            is_send=True,
            is_accepted=False,
            game=self.game
        )

        # Endpoint widoku
        self.url = reverse('debt-settlement')

    def authenticate(self, user):
        # Uwierzytelnienie użytkownika
        self.client.force_authenticate(user=user)

    def test_get_debts_authenticated(self):
        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Sprawdzanie struktury odpowiedzi dla outgoing debt
        outgoing = next((debt for debt in response.data if debt['type'] == 'outgoing'), None)
        self.assertIsNotNone(outgoing)
        self.assertEqual(outgoing['to'], "user2")
        self.assertEqual(outgoing['from'], "user1")
        self.assertEqual(outgoing['money'], 50)
        self.assertEqual(outgoing['phone_number'], None)  # Jeśli pole nie jest uzupełnione

        # Sprawdzanie struktury odpowiedzi dla incoming debt
        incoming = next((debt for debt in response.data if debt['type'] == 'incoming'), None)
        self.assertIsNotNone(incoming)
        self.assertEqual(incoming['to'], "user1")
        self.assertEqual(incoming['from'], "user2")
        self.assertEqual(incoming['money'], 30)
        self.assertEqual(incoming['phone_number'], None)

    def test_get_debts_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_debts_for_user(self):
        # Uwierzytelnienie użytkownika bez długów
        user3 = User.objects.create_user(username="user3", password="password123")
        self.authenticate(user3)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_outgoing_debt_accepted(self):
        # Oznaczamy outgoing debt jako zaakceptowany
        self.debt_outgoing.is_accepted = True
        self.debt_outgoing.save()

        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outgoing = next((debt for debt in response.data if debt['type'] == 'outgoing'), None)
        self.assertIsNone(outgoing)

    def test_incoming_debt_sent(self):
        # Oznaczamy incoming debt jako wysłany i zaakceptowany
        self.debt_incoming.is_send = False
        self.debt_incoming.save()

        self.authenticate(self.user1)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        incoming = next((debt for debt in response.data if debt['type'] == 'incoming'), None)
        self.assertIsNone(incoming)
