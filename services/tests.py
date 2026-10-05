import json
import uuid
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import Account, ProviderLoginEvent
from .models import (
    Booking,
    BookingCancellationRequest,
    BookingMessage,
    ChatbotInteraction,
    Service,
    ServiceProvider,
)


class ChatbotAssistantTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='chatbot_customer',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=self.user,
            role='customer',
        )
        self.client.force_authenticate(user=self.user)

    def test_chatbot_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            '/api/chatbot/',
            {'message': 'How do I track my booking?'},
            format='json',
        )

        self.assertEqual(response.status_code, 401)

    @override_settings(GEMINI_API_KEY='')
    def test_chatbot_answers_customer_without_gemini_key(self):
        session_id = uuid.uuid4()
        response = self.client.post(
            '/api/chatbot/',
            {
                'message': 'How do I track my booking?',
                'session_id': str(session_id),
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('My Bookings', response.data['reply'])
        interaction = ChatbotInteraction.objects.get()
        self.assertEqual(interaction.user, self.user)
        self.assertEqual(interaction.username, self.user.username)
        self.assertEqual(interaction.display_name, self.user.username)
        self.assertEqual(interaction.user_role, 'customer')
        self.assertEqual(interaction.session_id, session_id)
        self.assertEqual(interaction.question, 'How do I track my booking?')
        self.assertEqual(interaction.answer, response.data['reply'])

    @override_settings(GEMINI_API_KEY='')
    def test_chatbot_keeps_closed_sessions_separate_and_persisted(self):
        first_session = uuid.uuid4()
        second_session = uuid.uuid4()
        for session_id, question in (
            (first_session, 'How do I track my booking?'),
            (second_session, 'How do I compare providers?'),
        ):
            response = self.client.post(
                '/api/chatbot/',
                {
                    'message': question,
                    'session_id': str(session_id),
                },
                format='json',
            )
            self.assertEqual(response.status_code, 200)

        interactions = ChatbotInteraction.objects.order_by('id')
        self.assertEqual(interactions.count(), 2)
        self.assertEqual(
            [item.session_id for item in interactions],
            [first_session, second_session],
        )
        self.assertEqual(
            [item.question for item in interactions],
            [
                'How do I track my booking?',
                'How do I compare providers?',
            ],
        )

    @override_settings(GEMINI_API_KEY='')
    def test_chatbot_answers_provider_without_gemini_key(self):
        provider = User.objects.create_user(
            username='local_chatbot_provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(user=provider, role='provider')
        self.client.force_authenticate(user=provider)

        response = self.client.post(
            '/api/chatbot/',
            {'message': 'Where can I see my earnings?'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('Earnings overview', response.data['reply'])
        interaction = ChatbotInteraction.objects.get()
        self.assertEqual(interaction.user_role, 'provider')
        self.assertEqual(interaction.username, provider.username)
        self.assertEqual(
            interaction.question,
            'Where can I see my earnings?',
        )
        self.assertEqual(interaction.answer, response.data['reply'])

    @override_settings(GEMINI_API_KEY='')
    def test_chatbot_answers_tanglish_without_gemini_key(self):
        response = self.client.post(
            '/api/chatbot/',
            {'message': 'booking status epdi paakuradhu?'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('Customer dashboard-la', response.data['reply'])
        self.assertEqual(ChatbotInteraction.objects.count(), 1)
        self.assertEqual(
            ChatbotInteraction.objects.get().user_role,
            'customer',
        )

    @override_settings(GEMINI_API_KEY='test-api-key')
    @patch('services.chatbot.urlopen')
    def test_chatbot_uses_authenticated_customer_role(self, mock_urlopen):
        mock_urlopen.return_value = BytesIO(json.dumps({
            'candidates': [{
                'content': {
                    'parts': [{'text': 'Open My Bookings to track it.'}],
                },
            }],
        }).encode('utf-8'))

        response = self.client.post(
            '/api/chatbot/',
            {
                'message': 'How do I track my booking?',
                'history': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {'reply': 'Open My Bookings to track it.'},
        )
        request = mock_urlopen.call_args.args[0]
        self.assertEqual(request.get_header('X-goog-api-key'), 'test-api-key')
        payload = json.loads(request.data.decode('utf-8'))
        instruction = payload['systemInstruction']['parts'][0]['text']
        self.assertIn('The user is a customer.', instruction)
        self.assertEqual(ChatbotInteraction.objects.count(), 1)
        self.assertEqual(
            ChatbotInteraction.objects.get().answer,
            response.data['reply'],
        )

    @override_settings(GEMINI_API_KEY='test-api-key')
    @patch('services.chatbot.urlopen')
    def test_chatbot_uses_authenticated_provider_role(self, mock_urlopen):
        provider = User.objects.create_user(
            username='chatbot_provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=provider,
            role='provider',
        )
        self.client.force_authenticate(user=provider)
        mock_urlopen.return_value = BytesIO(json.dumps({
            'candidates': [{
                'content': {
                    'parts': [{'text': 'Check the bookings section.'}],
                },
            }],
        }).encode('utf-8'))

        response = self.client.post(
            '/api/chatbot/',
            {'message': 'How do I manage a new booking?'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode('utf-8'))
        instruction = payload['systemInstruction']['parts'][0]['text']
        self.assertIn('The user is a service provider.', instruction)
        interaction = ChatbotInteraction.objects.get()
        self.assertEqual(interaction.user, provider)
        self.assertEqual(interaction.user_role, 'provider')
        self.assertEqual(interaction.answer, response.data['reply'])


class ProviderServiceCreationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=self.user,
            role='provider',
        )
        self.client.force_authenticate(user=self.user)

    def test_provider_can_create_profile_then_service(self):
        profile_response = self.client.post(
            '/api/service-providers/',
            {
                'business_name': 'Reliable Repairs',
                'description': 'Home repair services.',
                'phone_number': '9876543210',
                'address': '123 Main Street',
                'experience': 5,
                'is_verified': True,
            },
            format='json',
        )

        self.assertEqual(profile_response.status_code, 201)
        provider = ServiceProvider.objects.get(user=self.user)
        self.assertFalse(provider.is_verified)

        service_response = self.client.post(
            '/api/services/',
            {
                'name': 'AC repair',
                'description': 'AC inspection and repair.',
                'price': '1500.00',
                'is_available': True,
            },
            format='json',
        )

        self.assertEqual(service_response.status_code, 201)
        service = Service.objects.get()
        self.assertEqual(service.provider, provider)

        public_service_response = self.client.get(
            f'/api/services/{service.id}/'
        )
        self.assertEqual(
            public_service_response.status_code,
            200
        )
        self.assertEqual(
            public_service_response.data['provider_name'],
            'Reliable Repairs'
        )
        self.assertEqual(
            public_service_response.data['provider_experience'],
            5,
        )
        self.assertFalse(
            public_service_response.data['provider_verified']
        )
        self.assertIsNotNone(
            public_service_response.data['created_at']
        )

    def test_deleted_service_is_archived_and_hidden_from_public_list(self):
        provider = ServiceProvider.objects.create(
            user=self.user,
            business_name='Reliable Repairs',
            phone_number='9876543210',
            address='123 Main Street',
            experience=5,
        )
        service = Service.objects.create(
            provider=provider,
            name='Archived plumbing',
            description='Pipe repair.',
            price='750.00',
        )

        response = self.client.delete(
            f'/api/services/{service.id}/'
        )

        self.assertEqual(response.status_code, 204)
        service.refresh_from_db()
        self.assertIsNotNone(service.deleted_at)
        self.assertFalse(service.is_available)

        provider_list_response = self.client.get('/api/services/')
        self.assertTrue(
            any(
                item['id'] == service.id and item['is_deleted']
                for item in provider_list_response.data
            )
        )

        self.client.force_authenticate(user=None)
        public_list_response = self.client.get('/api/services/')
        self.assertFalse(
            any(
                item['id'] == service.id
                for item in public_list_response.data
            )
        )


class ProviderBookingManagementTests(APITestCase):

    def setUp(self):
        self.provider_user = User.objects.create_user(
            username='booking_provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=self.provider_user,
            role='provider',
        )
        self.provider = ServiceProvider.objects.create(
            user=self.provider_user,
            business_name='Reliable Repairs',
            phone_number='9876543210',
            address='123 Main Street',
            experience=5,
        )
        self.service = Service.objects.create(
            provider=self.provider,
            name='AC repair',
            description='AC inspection and repair.',
            price='1500.00',
        )

        self.customer = User.objects.create_user(
            username='booking_customer',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=self.customer,
            role='customer',
        )
        self.booking = Booking.objects.create(
            user=self.customer,
            service=self.service,
            booking_date='2026-10-05',
            booking_time='10:00',
            address='456 Customer Road',
        )
        self.client.force_authenticate(
            user=self.provider_user
        )

    def test_provider_can_confirm_pending_booking(self):
        response = self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertIsNotNone(self.booking.confirmed_at)

    def test_completing_booking_sets_completion_timestamp(self):
        self.booking.status = 'confirmed'
        self.booking.save(update_fields=['status'])

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {'status': 'completed'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'completed')
        self.assertIsNotNone(self.booking.completed_at)
        self.assertIsNotNone(response.data['completed_at'])
        self.assertEqual(
            response.data['completed_price'],
            '1500.00',
        )

        self.service.price = '2000.00'
        self.service.save(update_fields=['price'])
        self.booking.refresh_from_db()
        self.assertEqual(
            str(self.booking.completed_price),
            '1500.00',
        )

    def test_provider_can_reject_booking_without_deleting_it(self):
        response = self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {
                'status': 'cancelled',
                'cancellation_reason': (
                    'The requested appointment time is unavailable.'
                ),
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')
        self.assertEqual(
            self.booking.cancellation_reason,
            'The requested appointment time is unavailable.',
        )
        self.assertEqual(self.booking.cancelled_by, 'provider')
        self.assertEqual(
            response.data['cancellation_reason'],
            'The requested appointment time is unavailable.',
        )
        self.assertTrue(
            Booking.objects.filter(
                pk=self.booking.pk
            ).exists()
        )

    def test_provider_must_explain_booking_rejection(self):
        response = self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {'status': 'cancelled'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'pending')
        self.assertEqual(self.booking.cancellation_reason, '')

    def test_customer_can_cancel_pending_booking_without_provider_approval(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/cancel/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')
        self.assertEqual(self.booking.cancelled_by, 'customer')
        self.assertFalse(
            BookingCancellationRequest.objects.filter(
                booking=self.booking
            ).exists()
        )

    def test_confirmed_booking_cannot_be_cancelled_directly(self):
        self.booking.status = 'confirmed'
        self.booking.save(update_fields=['status'])
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/cancel/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')

    def test_customer_can_read_provider_rejection_reason(self):
        self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {
                'status': 'cancelled',
                'cancellation_reason': 'This service area is not covered.',
            },
            format='json',
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bookings/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data[0]['cancellation_reason'],
            'This service area is not covered.',
        )
        self.assertEqual(response.data[0]['cancelled_by'], 'provider')
        self.assertEqual(response.data[0]['service_name'], 'AC repair')
        self.assertEqual(
            response.data[0]['customer_name'],
            'booking_customer',
        )
        self.assertEqual(
            response.data[0]['provider_name'],
            'Reliable Repairs',
        )

    def test_archiving_service_keeps_existing_booking_history(self):
        response = self.client.delete(
            f'/api/services/{self.service.id}/'
        )

        self.assertEqual(response.status_code, 204)
        self.assertTrue(
            Booking.objects.filter(
                pk=self.booking.pk
            ).exists()
        )
        self.service.refresh_from_db()
        self.assertIsNotNone(self.service.deleted_at)

    def test_provider_login_is_saved_and_history_is_private(self):
        response = self.client.post(
            '/api/login/',
            {
                'username': 'booking_provider',
                'password': 'Temporary-Test-Password-8391',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            ProviderLoginEvent.objects.filter(
                user=self.provider_user
            ).count(),
            1,
        )

        history_response = self.client.get(
            '/api/service-providers/login-history/'
        )
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(len(history_response.data), 1)
        self.assertIn('logged_at', history_response.data[0])

        self.client.force_authenticate(user=self.customer)
        private_history_response = self.client.get(
            '/api/service-providers/login-history/'
        )
        self.assertEqual(
            private_history_response.status_code,
            403,
        )

    def test_provider_cannot_respond_to_another_providers_booking(self):
        other_user = User.objects.create_user(
            username='other_provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=other_user,
            role='provider',
        )
        other_provider = ServiceProvider.objects.create(
            user=other_user,
            business_name='Other Repairs',
            phone_number='9876543211',
            address='789 Other Road',
            experience=3,
        )
        other_service = Service.objects.create(
            provider=other_provider,
            name='Plumbing',
            description='Pipe repairs.',
            price='500.00',
        )
        other_booking = Booking.objects.create(
            user=self.customer,
            service=other_service,
            booking_date='2026-10-06',
            booking_time='11:00',
            address='456 Customer Road',
        )

        response = self.client.post(
            f'/api/bookings/{other_booking.id}/respond/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertEqual(response.status_code, 404)
        other_booking.refresh_from_db()
        self.assertEqual(other_booking.status, 'pending')

    def test_provider_cannot_confirm_cancelled_booking(self):
        self.booking.status = 'cancelled'
        self.booking.save(update_fields=['status'])

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/respond/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')

    def test_customer_and_provider_can_chat_while_booking_is_pending(self):
        endpoint = f'/api/bookings/{self.booking.id}/messages/'

        self.client.force_authenticate(user=self.customer)
        customer_response = self.client.post(
            endpoint,
            {
                'message': 'The AC is in the upstairs bedroom.',
                'sender': self.provider_user.id,
            },
            format='json',
        )

        self.assertEqual(customer_response.status_code, 201)
        self.assertEqual(
            customer_response.data['sender'],
            self.customer.id,
        )
        self.assertEqual(
            customer_response.data['sender_role'],
            'customer',
        )

        self.client.force_authenticate(user=self.provider_user)
        provider_response = self.client.post(
            endpoint,
            {'message': 'Thanks, I have noted that.'},
            format='json',
        )

        self.assertEqual(provider_response.status_code, 201)
        self.assertEqual(
            provider_response.data['sender'],
            self.provider_user.id,
        )
        self.assertEqual(
            provider_response.data['sender_role'],
            'provider',
        )
        self.assertEqual(
            BookingMessage.objects.filter(
                booking=self.booking
            ).count(),
            2,
        )

        history_response = self.client.get(endpoint)
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(len(history_response.data), 2)
        self.assertEqual(
            history_response.data[0]['message'],
            'The AC is in the upstairs bedroom.',
        )

    def test_unrelated_customer_cannot_read_or_send_booking_messages(self):
        unrelated_customer = User.objects.create_user(
            username='unrelated_customer',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=unrelated_customer,
            role='customer',
        )
        self.client.force_authenticate(user=unrelated_customer)
        endpoint = f'/api/bookings/{self.booking.id}/messages/'

        read_response = self.client.get(endpoint)
        send_response = self.client.post(
            endpoint,
            {'message': 'This should not be allowed.'},
            format='json',
        )

        self.assertEqual(read_response.status_code, 404)
        self.assertEqual(send_response.status_code, 404)
        self.assertFalse(
            BookingMessage.objects.filter(
                booking=self.booking
            ).exists()
        )

        unrelated_provider_user = User.objects.create_user(
            username='unrelated_provider',
            password='Temporary-Test-Password-8391',
        )
        Account.objects.create(
            user=unrelated_provider_user,
            role='provider',
        )
        unrelated_provider = ServiceProvider.objects.create(
            user=unrelated_provider_user,
            business_name='Different Repairs',
            phone_number='9876543212',
            address='789 Other Road',
            experience=2,
        )
        self.client.force_authenticate(
            user=unrelated_provider_user
        )
        provider_read_response = self.client.get(endpoint)
        provider_send_response = self.client.post(
            endpoint,
            {'message': 'This provider is not assigned.'},
            format='json',
        )

        self.assertIsNotNone(unrelated_provider)
        self.assertEqual(provider_read_response.status_code, 404)
        self.assertEqual(provider_send_response.status_code, 404)
        self.assertFalse(
            BookingMessage.objects.filter(
                booking=self.booking
            ).exists()
        )

    def test_booking_chat_rejects_blank_messages(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'message': '   '},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            BookingMessage.objects.filter(
                booking=self.booking
            ).exists()
        )

    def test_chat_delivery_and_read_receipts_follow_presence(self):
        endpoint = f'/api/bookings/{self.booking.id}/messages/'
        self.client.force_authenticate(user=self.customer)

        offline_response = self.client.post(
            endpoint,
            {'message': 'Are you available tomorrow?'},
            format='json',
        )
        self.assertEqual(offline_response.status_code, 201)
        self.assertEqual(
            offline_response.data['delivery_status'],
            'sent',
        )

        self.client.force_authenticate(user=self.provider_user)
        presence_response = self.client.post(
            '/api/bookings/presence/',
            {},
            format='json',
        )
        self.assertEqual(presence_response.status_code, 200)
        self.assertTrue(presence_response.data['is_online'])

        self.client.force_authenticate(user=self.customer)
        online_response = self.client.post(
            endpoint,
            {'message': 'I have added the address details.'},
            format='json',
        )
        self.assertEqual(online_response.status_code, 201)
        self.assertEqual(
            online_response.data['delivery_status'],
            'delivered',
        )

        self.client.force_authenticate(user=self.customer)
        provider_presence_response = self.client.get(
            f'/api/bookings/{self.booking.id}/presence/'
        )
        self.assertEqual(provider_presence_response.status_code, 200)
        self.assertTrue(provider_presence_response.data['is_online'])

        self.client.force_authenticate(user=self.provider_user)
        read_response = self.client.get(endpoint)
        self.assertEqual(read_response.status_code, 200)
        self.assertEqual(
            read_response.data[1]['delivery_status'],
            'read',
        )
        self.assertIsNotNone(
            read_response.data[1]['read_at']
        )

        self.client.force_authenticate(user=self.customer)
        self.client.post(
            '/api/bookings/presence/',
            {},
            format='json',
        )
        self.client.force_authenticate(user=self.provider_user)
        reverse_direction_response = self.client.post(
            endpoint,
            {'message': 'I can inspect it tomorrow morning.'},
            format='json',
        )
        self.assertEqual(reverse_direction_response.status_code, 201)
        self.assertEqual(
            reverse_direction_response.data['delivery_status'],
            'delivered',
        )

        self.client.force_authenticate(user=self.customer)
        refreshed_messages = self.client.get(endpoint)
        self.assertEqual(
            refreshed_messages.data[1]['delivery_status'],
            'read',
        )
        self.assertEqual(
            refreshed_messages.data[2]['delivery_status'],
            'read',
        )

    def test_incoming_message_notification_includes_customer_and_service(self):
        self.client.force_authenticate(user=self.customer)
        message_response = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'message': 'The AC is making a loud noise.'},
            format='json',
        )
        self.assertEqual(message_response.status_code, 201)

        self.client.force_authenticate(user=self.provider_user)
        self.provider_user.account.last_seen_at = timezone.now()
        self.provider_user.account.save(update_fields=['last_seen_at'])
        notification_response = self.client.get(
            '/api/bookings/notifications/'
        )

        self.assertEqual(notification_response.status_code, 200)
        self.assertEqual(len(notification_response.data), 1)
        notification = notification_response.data[0]
        self.assertEqual(notification['sender_name'], 'booking_customer')
        self.assertEqual(notification['service_name'], 'AC repair')
        self.assertEqual(notification['booking'], self.booking.id)
        self.assertEqual(
            notification['delivery_status'],
            'delivered',
        )
        self.assertIsNotNone(
            BookingMessage.objects.get(
                id=message_response.data['id']
            ).delivered_at
        )

        provider_reply = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'message': 'I can check the unit tomorrow.'},
            format='json',
        )
        self.assertEqual(provider_reply.status_code, 201)

        self.client.force_authenticate(user=self.customer)
        customer_notification_response = self.client.get(
            '/api/bookings/notifications/'
        )
        self.assertEqual(
            customer_notification_response.status_code,
            200,
        )
        self.assertEqual(
            len(customer_notification_response.data),
            1,
        )
        self.assertEqual(
            customer_notification_response.data[0]['sender_name'],
            'booking_provider',
        )
        self.assertEqual(
            customer_notification_response.data[0]['service_name'],
            'AC repair',
        )

    def test_confirmed_booking_cancellation_requires_provider_read_and_approval(self):
        self.booking.status = 'confirmed'
        self.booking.save(update_fields=['status'])
        self.client.force_authenticate(user=self.customer)

        request_response = self.client.post(
            f'/api/bookings/{self.booking.id}/request-cancellation/',
            {'reason': 'I no longer need this service.'},
            format='json',
        )

        self.assertEqual(request_response.status_code, 201)
        self.assertEqual(
            request_response.data['status'],
            'confirmed',
        )
        self.assertEqual(
            request_response.data['cancellation_request']['status'],
            'pending',
        )
        self.booking.refresh_from_db()
        cancellation = self.booking.cancellation_requests.first()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(
            cancellation.reason,
            'I no longer need this service.',
        )
        self.assertEqual(
            cancellation.message.sender,
            self.customer,
        )
        self.assertIn(
            cancellation.reason,
            cancellation.message.message,
        )

        self.client.force_authenticate(user=self.provider_user)
        decision_endpoint = (
            f'/api/bookings/{self.booking.id}/cancellation-request/'
        )
        premature_decision = self.client.post(
            decision_endpoint,
            {'decision': 'approved'},
            format='json',
        )
        self.assertEqual(premature_decision.status_code, 403)

        review_response = self.client.get(decision_endpoint)
        self.assertEqual(review_response.status_code, 200)
        self.assertIsNotNone(
            review_response.data['provider_read_at']
        )
        cancellation.refresh_from_db()
        cancellation.message.refresh_from_db()
        self.assertIsNotNone(cancellation.message.read_at)

        approval_response = self.client.post(
            decision_endpoint,
            {
                'decision': 'approved',
                'provider_response': 'Understood, I have cancelled it.',
            },
            format='json',
        )
        self.assertEqual(approval_response.status_code, 200)
        self.booking.refresh_from_db()
        cancellation.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')
        self.assertEqual(self.booking.cancelled_by, 'customer')
        self.assertEqual(
            self.booking.cancellation_reason,
            'I no longer need this service.',
        )
        self.assertEqual(cancellation.status, 'approved')
        self.assertEqual(
            cancellation.provider_response,
            'Understood, I have cancelled it.',
        )
        self.assertEqual(
            approval_response.data['cancellation_request']['status'],
            'approved',
        )

        self.client.force_authenticate(user=self.customer)
        history_response = self.client.get(
            f'/api/bookings/{self.booking.id}/messages/'
        )
        self.assertEqual(history_response.status_code, 200)
        self.assertIn(
            'approved',
            history_response.data[-1]['message'],
        )

    def test_provider_can_reject_cancellation_request_and_booking_stays_confirmed(self):
        self.booking.status = 'confirmed'
        self.booking.save(update_fields=['status'])
        self.client.force_authenticate(user=self.customer)

        request_response = self.client.post(
            f'/api/bookings/{self.booking.id}/request-cancellation/',
            {'reason': 'My plans changed unexpectedly.'},
            format='json',
        )
        self.assertEqual(request_response.status_code, 201)

        self.client.force_authenticate(user=self.provider_user)
        decision_endpoint = (
            f'/api/bookings/{self.booking.id}/cancellation-request/'
        )
        self.client.get(decision_endpoint)
        rejection_response = self.client.post(
            decision_endpoint,
            {
                'decision': 'rejected',
                'provider_response': 'The visit is already underway.',
            },
            format='json',
        )

        self.assertEqual(rejection_response.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(
            rejection_response.data['cancellation_request']['status'],
            'rejected',
        )
        self.assertEqual(
            rejection_response.data['cancellation_request'][
                'provider_response'
            ],
            'The visit is already underway.',
        )

    def test_cancellation_request_rejects_short_reason(self):
        self.booking.status = 'confirmed'
        self.booking.save(update_fields=['status'])
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            f'/api/bookings/{self.booking.id}/request-cancellation/',
            {'reason': 'No'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            BookingCancellationRequest.objects.filter(
                booking=self.booking
            ).exists()
        )

    def test_conversations_list_is_booking_scoped_for_both_participants(self):
        self.client.force_authenticate(user=self.customer)
        message_response = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'message': 'I will be home after 4 PM.'},
            format='json',
        )
        self.assertEqual(message_response.status_code, 201)

        customer_conversations = self.client.get(
            '/api/bookings/conversations/'
        )
        self.assertEqual(customer_conversations.status_code, 200)
        self.assertEqual(len(customer_conversations.data), 1)
        customer_conversation = customer_conversations.data[0]
        self.assertEqual(
            customer_conversation['booking_id'],
            self.booking.id,
        )
        self.assertEqual(
            customer_conversation['other_party_name'],
            'Reliable Repairs',
        )
        self.assertEqual(
            customer_conversation['service_name'],
            'AC repair',
        )
        self.assertEqual(
            customer_conversation['latest_message'],
            'I will be home after 4 PM.',
        )
        self.assertEqual(
            customer_conversation['unread_count'],
            0,
        )

        self.client.force_authenticate(user=self.provider_user)
        provider_conversations = self.client.get(
            '/api/bookings/conversations/'
        )
        self.assertEqual(provider_conversations.status_code, 200)
        self.assertEqual(len(provider_conversations.data), 1)
        self.assertEqual(
            provider_conversations.data[0]['other_party_name'],
            'booking_customer',
        )
        self.assertEqual(
            provider_conversations.data[0]['unread_count'],
            1,
        )

        self.client.force_authenticate(user=self.customer)
        self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'message': 'Thanks, I will be ready.'},
            format='json',
        )
        self.client.force_authenticate(user=self.provider_user)
        updated_conversations = self.client.get(
            '/api/bookings/conversations/'
        )
        self.assertEqual(
            updated_conversations.data[0]['unread_count'],
            2,
        )
