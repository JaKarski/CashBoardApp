from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class UserDetailViewTestCase(APITestCase):
    
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123',
            first_name='Test',
            last_name='User'
        )
        self.url = '/api/user/' 
        # Generate a JWT token for the test user
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_user_detail_authenticated(self):
        # Add the JWT token to the request headers
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Send a GET request to the view
        response = self.client.get(self.url)
        
        # Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'first_name': 'Test',
            'last_name': 'User',
        })

    def test_user_detail_unauthenticated(self):
        # Send a GET request without the JWT token
        response = self.client.get(self.url)
        
        # Check the response status
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
