from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class CheckSuperuserStatusViewTestCase(APITestCase):
    
    def setUp(self):
        # Create a regular user
        self.regular_user = User.objects.create_user(
            username='regularuser',
            password='password123',
            is_superuser=False
        )

        # Create a superuser
        self.superuser = User.objects.create_superuser(
            username='superuser',
            password='password123'
        )

        self.url = '/api/check-superuser/'

    def get_token(self, user):
        # Generate a JWT token for the given user
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    def test_superuser_status_true(self):
        # Authenticate as a superuser
        token = self.get_token(self.superuser)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Send a GET request
        response = self.client.get(self.url)
        
        # Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'is_superuser': True})

    def test_superuser_status_false(self):
        # Authenticate as a regular user
        token = self.get_token(self.regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Send a GET request
        response = self.client.get(self.url)
        
        # Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'is_superuser': False})

    def test_unauthenticated_access(self):
        # Send a GET request without authentication
        response = self.client.get(self.url)
        
        # Check the response status
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
