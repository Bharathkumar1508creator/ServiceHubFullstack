from django.test import override_settings
from rest_framework.test import APITestCase


@override_settings(ALLOWED_HOSTS=['testserver'])
class RegistrationAndLoginTests(APITestCase):

    def register(
        self,
        username,
        email,
        first_name='',
        role='customer'
    ):
        return self.client.post(
            '/api/register/',
            {
                'username': username,
                'email': email,
                'first_name': first_name,
                'role': role,
                'password': 'Temporary-Test-Password-8391',
            },
            format='json'
        )

    def test_new_user_can_login_with_email(self):
        email = 'customer@example.test'
        registration = self.register('email_customer', email)

        self.assertEqual(registration.status_code, 201)

        login = self.client.post(
            '/api/login/',
            {
                'username': email,
                'password': 'Temporary-Test-Password-8391',
            },
            format='json'
        )

        self.assertEqual(login.status_code, 200)
        self.assertEqual(
            login.data['user']['username'],
            'email_customer',
        )

    def test_login_returns_registered_name_and_role(self):
        registration = self.register(
            'service_provider',
            'provider@example.test',
            first_name='Taylor',
            role='provider'
        )

        self.assertEqual(registration.status_code, 201)
        self.assertEqual(registration.data['first_name'], 'Taylor')
        self.assertEqual(registration.data['role'], 'provider')

        login = self.client.post(
            '/api/login/',
            {
                'username': 'provider@example.test',
                'password': 'Temporary-Test-Password-8391',
            },
            format='json'
        )

        self.assertEqual(login.status_code, 200)
        self.assertEqual(
            login.data['user']['first_name'],
            'Taylor',
        )
        self.assertEqual(
            login.data['user']['role'],
            'provider',
        )

    def test_new_user_can_still_login_with_username(self):
        registration = self.register(
            'username_customer',
            'username_customer@example.test'
        )

        self.assertEqual(registration.status_code, 201)

        login = self.client.post(
            '/api/login/',
            {
                'username': 'username_customer',
                'password': 'Temporary-Test-Password-8391',
            },
            format='json'
        )

        self.assertEqual(login.status_code, 200)
        self.assertEqual(
            login.data['user']['username'],
            'username_customer',
        )

    def test_refresh_token_returns_a_new_access_token(self):
        registration = self.register(
            'refresh_customer',
            'refresh_customer@example.test'
        )
        self.assertEqual(registration.status_code, 201)

        login = self.client.post(
            '/api/login/',
            {
                'username': 'refresh_customer@example.test',
                'password': 'Temporary-Test-Password-8391',
            },
            format='json'
        )
        self.assertEqual(login.status_code, 200)

        refresh = self.client.post(
            '/api/token/refresh/',
            {
                'refresh': login.data['refresh_token'],
            },
            format='json'
        )

        self.assertEqual(refresh.status_code, 200)
        self.assertIn('access', refresh.data)

    def test_registration_rejects_duplicate_email(self):
        first = self.register('first_customer', 'shared@example.test')
        second = self.register('second_customer', 'SHARED@example.test')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
