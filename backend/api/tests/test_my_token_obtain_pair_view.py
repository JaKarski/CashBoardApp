from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.utils.timezone import now, timedelta
from rest_framework_simplejwt.tokens import RefreshToken

class MyTokenObtainPairViewTestCase(APITestCase):
    
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='securepassword123',
        )
        self.url = '/api/token/' 

    def test_obtain_token_success(self):
        # Send a POST request with valid credentials
        response = self.client.post(self.url, {
            'username': 'testuser',
            'password': 'securepassword123',
        })
        
        # Check if the response status is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if access and refresh tokens are present in the response
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_last_login_updated(self):
        # Save the previous value of last_login
        previous_last_login = self.user.last_login
        
        # Send a POST request with valid credentials
        self.client.post(self.url, {
            'username': 'testuser',
            'password': 'securepassword123',
        })
        
        # Refresh the user object from the database
        self.user.refresh_from_db()
        
        # Check if last_login is updated and is later than the previous value
        self.assertIsNotNone(self.user.last_login)
        self.assertGreater(self.user.last_login, previous_last_login if previous_last_login else now() - timedelta(seconds=1))

    def test_obtain_token_failure(self):
        # Send a POST request with invalid credentials
        response = self.client.post(self.url, {
            'username': 'testuser',
            'password': 'wrongpassword',
        })
        
        # Check if the response status is 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Check if the response contains the error detail
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'No active account found with the given credentials')
