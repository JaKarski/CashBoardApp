from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.urls import reverse
from api.models import Debts
from django.utils import timezone

class SendDebtViewTest(APITestCase):

    def setUp(self):
        # Tworzenie użytkowników
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Tworzenie długu
        self.debt = Debts.objects.create(
            sender=self.user1,
            reciver=self.user2,
            amount=100,
            is_send=False
        )

        # Endpoint widoku
        self.url = reverse('send-debt', kwargs={'debt_id': self.debt.id})

    def authenticate(self, user):
        # Uwierzytelnienie użytkownika
        self.client.force_authenticate(user=user)

    def test_send_debt_success(self):
        self.authenticate(self.user1)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Debt sent successfully!")

        # Sprawdzenie, czy dług został zaktualizowany
        self.debt.refresh_from_db()
        self.assertTrue(self.debt.is_send)
        self.assertIsNotNone(self.debt.send_date)

    def test_send_debt_unauthenticated(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_send_debt_not_found(self):
        self.authenticate(self.user1)
        invalid_url = reverse('send-debt', kwargs={'debt_id': 9999})

        response = self.client.post(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_send_debt_not_authorized(self):
        self.authenticate(self.user2)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_send_debt_already_sent(self):
        # Oznaczamy dług jako wysłany
        self.debt.is_send = True
        self.debt.save()

        self.authenticate(self.user1)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
