from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User

class CreateUserViewTests(APITestCase):
    def setUp(self):
        # Set up an existing user for duplicate checks
        User.objects.create_user(username="existinguser", email="duplicate@example.com", password="password")

    def test_user_registration_duplicate_email(self):
        """
        Test registration with an already existing email.
        """
        data = {
            "username": "newuser",
            "password": "securepassword123",
            "email": "duplicate@example.com",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post("/api/user/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertEqual(response.data["email"][0], "This email is already in use.")

    def test_user_registration_duplicate_username(self):
        """
        Test registration with an already existing username.
        """
        data = {
            "username": "existinguser",
            "password": "securepassword123",
            "email": "new@example.com",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post("/api/user/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(response.data["username"][0], "A user with that username already exists.")

    def test_password_strength_validation(self):
        """
        Test validation for weak passwords.
        """
        data = {
            "username": "testuser",
            "password": "123",  # Weak password
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post("/api/user/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertTrue("must contain at least 8 characters" in response.data["password"][0])

    def test_missing_required_fields(self):
        """
        Test registration fails if required fields are missing.
        """
        data = {
            # Missing fields like username, phone_number, etc.
            "password": "securepassword123",
            "email": "test@example.com",
            "first_name": "Test",
        }
        response = self.client.post("/api/user/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for missing fields in the response
        self.assertIn("username", response.data)
        self.assertIn("phone_number", response.data)
        self.assertIn("last_name", response.data)

