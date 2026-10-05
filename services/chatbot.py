import json
import logging
import os
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatbotInteraction


logger = logging.getLogger(__name__)


class ChatbotRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        max_length=2000,
        trim_whitespace=True,
    )
    session_id = serializers.UUIDField(required=False)
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        max_length=8,
    )

    def validate_message(self, value):
        if not value:
            raise serializers.ValidationError(
                'Please enter a message.'
            )
        return value

    def validate_history(self, history):
        validated_history = []
        for item in history:
            role = item.get('role')
            content = item.get('content')
            if (
                role not in ('user', 'assistant')
                or not isinstance(content, str)
                or not content.strip()
            ):
                raise serializers.ValidationError(
                    'Chat history contains an invalid message.'
                )
            validated_history.append({
                'role': role,
                'content': content[:2000],
            })
        return validated_history


def _system_instruction(role):
    role_guidance = {
        'customer': (
            'The user is a customer. Help them discover and compare '
            'services, understand prices and providers, book or track '
            'services, chat with their assigned provider, and manage '
            'cancellations or account questions.'
        ),
        'provider': (
            'The user is a service provider. Help them manage their '
            'profile and services, respond to and track bookings, '
            'communicate with customers, review cancellation requests, '
            'and understand earnings and account questions.'
        ),
    }[role]
    return (
        'You are ServiceHub Assistant, a helpful support chatbot for a '
        'home-services booking platform. '
        f'{role_guidance} '
        'Give clear, practical, step-by-step suggestions when useful. '
        'Use the same language as the user where possible, including '
        'Tamil or Tamil-English. Do not claim to have accessed or changed '
        'their account, booking, payment, or messages. If an action needs '
        'the app, explain where the user can do it and ask them to verify '
        'the current status in the app. Never request passwords, payment '
        'card details, or authentication codes. If a question is outside '
        'ServiceHub support, say so briefly and offer relevant guidance.'
    )


def _local_reply(role, message):
    question = message.casefold()
    is_tamil_english = any(
        word in question
        for word in (
            'epdi',
            'eppadi',
            'panna',
            'pannalam',
            'venum',
            'enna',
            'iruku',
            'irukku',
            'aachu',
            'mudiyum',
            'seiy',
        )
    )

    def answer(english, tanglish):
        return tanglish if is_tamil_english else english

    if any(word in question for word in ('hello', 'hi ', 'hey', 'vanakkam')):
        return answer(
            'Hi! I can help with ServiceHub bookings, services, chats, '
            'cancellations, and account questions. What would you like to do?',
            'Vanakkam! ServiceHub-la bookings, services, chat, cancellation '
            'matrum account questions-ku help pannuren. Enna venum?',
        )

    if role == 'customer':
        if any(word in question for word in ('cancel', 'cancellation', 'cancell', 'rathu')):
            return answer(
                'For a pending booking, open My Bookings and cancel it from '
                'the booking tracker. If the provider has accepted it, submit '
                'a cancellation request with your reason; the provider must '
                'review it before the booking is cancelled.',
                'Pending booking-na My Bookings-la booking tracker open panni '
                'cancel pannunga. Provider accept pannita, unga reason-oda '
                'cancellation request submit pannunga; provider review '
                'panni accept pannina apram cancel aagum.',
            )
        if any(word in question for word in ('track', 'status', 'progress', 'where is', 'my booking')):
            return answer(
                'Open My Bookings on your customer dashboard and select a '
                'booking to see its status and progress. Open the booking '
                'tracker for the full timeline, provider updates, and chat.',
                'Customer dashboard-la My Bookings open panni booking select '
                'pannunga; status/progress theriyum. Full timeline, provider '
                'updates, chat-ku booking tracker open pannunga.',
            )
        if any(word in question for word in ('compare', 'comparison', 'best provider', 'which provider')):
            return answer(
                'Go to Services and search for the service you need. When '
                'multiple providers offer the same service, use Compare to '
                'review their price, experience, rating, and service details.',
                'Services page-la thevaiyana service search pannunga. Orey '
                'service-ku pala providers irundha Compare use panni price, '
                'experience, rating, details compare pannalaam.',
            )
        if any(word in question for word in ('book', 'booking', 'reserve')):
            return answer(
                'Open Services, choose a provider and service, then use the '
                'booking option and submit the requested details. You can '
                'follow the booking later from My Bookings.',
                'Services page-la provider/service select panni booking option '
                'use pannitu details submit pannunga. Apram My Bookings-la '
                'status track pannalaam.',
            )
        if any(word in question for word in ('chat', 'message', 'contact provider')):
            return answer(
                'Open the booking tracker or Chats page and select the '
                'conversation for that booking. Booking chat is private to '
                'you and the assigned provider.',
                'Booking tracker illa Chats page open panni andha booking '
                'conversation select pannunga. Andha chat neengalum assigned '
                'provider-um mattum paakalaam.',
            )
        if any(word in question for word in ('search', 'service', 'provider', 'find')):
            return answer(
                'Browse or search on the Services page. Open a service to '
                'review its provider and details; if there are multiple '
                'matching providers, compare them before booking.',
                'Services page-la browse/search pannunga. Service open panni '
                'provider details paathutu, pala providers match aana '
                'booking-ku munnaadi compare pannunga.',
            )
    else:
        if any(word in question for word in ('cancel', 'cancellation', 'rathu')):
            return answer(
                'Open the booking in your provider dashboard. For a customer '
                'cancellation request, choose Review cancellation, read the '
                'customer’s reason, then approve or reject it with a response.',
                'Provider dashboard-la booking open pannunga. Customer '
                'cancellation request-ku Review cancellation select panni, '
                'reason padichitu response-oda approve illa reject pannunga.',
            )
        if any(word in question for word in ('earn', 'income', 'revenue', 'payment', 'money')):
            return answer(
                'Open Earnings overview on your provider dashboard. It shows '
                'completed-service earnings, monthly and yearly totals, and '
                'recent earnings. Only completed services count toward earnings.',
                'Provider dashboard-la Earnings overview open pannunga. '
                'Completed services earnings, monthly/yearly total, recent '
                'earnings anga theriyum. Completed services mattum earnings-la '
                'count aagum.',
            )
        if any(word in question for word in ('accept', 'reject', 'pending', 'booking', 'request')):
            return answer(
                'Open your provider dashboard and review the booking card. '
                'Use its available action to accept or reject the request; '
                'check the booking status there for the latest update.',
                'Provider dashboard-la booking card open panni request review '
                'pannunga. Anga irukkura action use panni accept/reject '
                'pannalaam; latest status-um anga check pannunga.',
            )
        if any(word in question for word in ('chat', 'message', 'customer')):
            return answer(
                'Open Chats or the relevant booking in your provider dashboard '
                'to message its customer. Each conversation is limited to the '
                'customer and provider on that booking.',
                'Chats page illa provider dashboard-la relevant booking open '
                'panni customer-kku message pannunga. Andha booking customer '
                'matrum provider mattum chat paakalaam.',
            )
        if any(word in question for word in ('service', 'profile', 'business', 'price', 'edit')):
            return answer(
                'Open My Services on your provider dashboard to manage your '
                'service listings. Review your provider profile details there '
                'as well, and save any changes before leaving the page.',
                'Provider dashboard-la My Services open panni service '
                'listings manage pannunga. Provider profile details-um '
                'review panni, changes irundha save pannitu exit pannunga.',
            )

    return answer(
        'I can help with common ServiceHub questions. '
        + (
            'Try asking about booking requests, managing services, earnings, '
            'customer chat, or cancellation reviews.'
            if role == 'provider'
            else 'Try asking about finding or comparing services, booking '
            'status, chatting with your provider, or cancelling a booking.'
        ),
        'ServiceHub use panna common questions-ku help pannuren. '
        + (
            'Booking requests, services manage pannradhu, earnings, customer '
            'chat, cancellation review pathi kelunga.'
            if role == 'provider'
            else 'Service search/compare, booking status, provider chat, '
            'cancellation pathi kelunga.'
        ),
    )


class ChatbotAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def _save_interaction(
        self,
        user,
        role,
        session_id,
        question,
        answer,
    ):
        display_name = ' '.join(
            part
            for part in (user.first_name, user.last_name)
            if part
        ).strip() or user.username
        ChatbotInteraction.objects.create(
            user=user,
            username=user.username,
            display_name=display_name,
            user_role=role,
            session_id=session_id,
            question=question,
            answer=answer,
        )

    def post(self, request):
        serializer = ChatbotRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        account = getattr(request.user, 'account', None)
        role = getattr(account, 'role', None)
        if role not in ('customer', 'provider'):
            return Response(
                {'detail': 'A customer or provider account is required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        session_id = serializer.validated_data.get(
            'session_id',
            uuid.uuid4(),
        )
        api_key = getattr(
            settings,
            'GEMINI_API_KEY',
            os.getenv('GEMINI_API_KEY', ''),
        )
        if not api_key:
            reply = _local_reply(
                role,
                serializer.validated_data['message'],
            )
            self._save_interaction(
                request.user,
                role,
                session_id,
                serializer.validated_data['message'],
                reply,
            )
            return Response(
                {'reply': reply}
            )

        model = getattr(
            settings,
            'GEMINI_MODEL',
            os.getenv('GEMINI_MODEL', 'gemini-2.5-flash'),
        )
        history = serializer.validated_data.get('history', [])
        contents = [
            {
                'role': 'model' if item['role'] == 'assistant' else 'user',
                'parts': [{'text': item['content']}],
            }
            for item in history
        ]
        contents.append({
            'role': 'user',
            'parts': [{
                'text': serializer.validated_data['message'],
            }],
        })

        request_body = json.dumps({
            'systemInstruction': {
                'parts': [{'text': _system_instruction(role)}],
            },
            'contents': contents,
            'generationConfig': {
                'temperature': 0.5,
                'maxOutputTokens': 700,
            },
        }).encode('utf-8')
        gemini_request = Request(
            (
                'https://generativelanguage.googleapis.com/v1beta/'
                f'models/{model}:generateContent'
            ),
            data=request_body,
            headers={
                'Content-Type': 'application/json',
                'x-goog-api-key': api_key,
            },
            method='POST',
        )

        try:
            with urlopen(gemini_request, timeout=25) as response:
                result = json.loads(response.read().decode('utf-8'))
        except HTTPError as error:
            logger.warning(
                'Gemini chatbot request failed with HTTP status %s.',
                error.code,
            )
            return Response(
                {
                    'detail': (
                        'The assistant could not answer right now. '
                        'Please try again shortly.'
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except (URLError, TimeoutError):
            logger.exception('Gemini chatbot could not be reached.')
            return Response(
                {
                    'detail': (
                        'The assistant could not connect right now. '
                        'Please try again shortly.'
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            logger.exception('Gemini chatbot returned invalid JSON.')
            return Response(
                {'detail': 'The assistant returned an invalid response.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            reply = ''.join(
                part['text']
                for part in result['candidates'][0]['content']['parts']
                if isinstance(part.get('text'), str)
            ).strip()
        except (AttributeError, KeyError, IndexError, TypeError):
            logger.warning('Gemini chatbot response had no text candidate.')
            reply = ''

        if not reply:
            return Response(
                {
                    'detail': (
                        'The assistant could not create a reply. '
                        'Please rephrase and try again.'
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        self._save_interaction(
            request.user,
            role,
            session_id,
            serializer.validated_data['message'],
            reply,
        )
        return Response({'reply': reply})
