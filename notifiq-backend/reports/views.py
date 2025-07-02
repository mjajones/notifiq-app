from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from .models import Incident, Attachment, Asset, ActivityLog, StatusLabel, UserNote
from .serializers import (
    IncidentSerializer,
    AttachmentSerializer,
    UserSerializer,
    AssetSerializer,
    RegisterSerializer,
    MyTokenObtainPairSerializer,
    StatusLabelSerializer,
    UserNoteSerializer
)
import json
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView

class StatusLabelViewSet(viewsets.ModelViewSet):
    queryset = StatusLabel.objects.all()
    serializer_class = StatusLabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        print("DEBUG: StatusLabelViewSet.list called")
        queryset = self.get_queryset()
        print(f"DEBUG: Found {queryset.count()} status labels")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        # Set the username to the email before saving
        user = serializer.save(username=serializer.validated_data['email'])
        
        # Email Verification logic remains the same
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        mail_subject = 'Activate your NotifiQ account.'
        message = render_to_string('account_verification_email.html', {
            'user': user,
            'verification_url': verification_url,
        })
        
        email = EmailMessage(
            mail_subject, message, to=[user.email]
        )

        email.content_subtype = "html"
        
        email.send()

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'message': 'Email successfully verified!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid!'}, status=status.HTTP_400_BAD_REQUEST)

class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['requester_email', 'agent', 'status__name']

    def get_queryset(self):
        user = self.request.user
        is_staff = user.is_superuser or user.groups.filter(name='IT Staff').exists()
        if is_staff:
            return Incident.objects.all().order_by('-submitted_at')
        if user.is_authenticated:
            return Incident.objects.filter(requester_email=user.email).order_by('-submitted_at')
        return Incident.objects.none()

    def list(self, request, *args, **kwargs):
        """
        Manually override the default list action to ensure data is returned.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # We manually wrap the data in a 'results' key to match the frontend's expectation
        return Response({'results': serializer.data})

    def perform_create(self, serializer):
        # Set default status to "Open" if not provided
        open_status = StatusLabel.objects.filter(name="Open").first()
        serializer.save(requester_email=self.request.user.email, status=open_status)

    def partial_update(self, request, *args, **kwargs):
        print("DEBUG: partial_update data:", request.data)
        incident = self.get_object()
        user = request.user
        data = request.data.copy()
        for key, value in data.items():
            if hasattr(incident, key) and getattr(incident, key) != value:
                ActivityLog.objects.create(
                    incident=incident, user=user, activity_type=f'{key.replace("_", " ").title()} Change',
                    old_value=str(getattr(incident, key)), new_value=str(value)
                )
        if 'internal_note' in data:
            ActivityLog.objects.create(
                incident=incident, user=user, activity_type='Note Added', note=data.get('internal_note')
            )
        serializer = self.get_serializer(incident, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def test_serialization(self, request):
        # We will leave this in for now, but it can be removed once everything is working.
        print("\n[SERIALIZATION TEST] Starting test...")
        all_incidents = Incident.objects.all()
        print(f"[SERIALIZATION TEST] Found {all_incidents.count()} total incidents to test.")
        for incident in all_incidents:
            try:
                serializer = self.get_serializer(incident)
                _ = serializer.data
            except Exception as e:
                return Response({"error": f"Serialization failed on Incident ID {incident.id}", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"status": "All tickets are OK"}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        original_incident = self.get_object()
        new_incident = original_incident
        new_incident.pk = None
        new_incident.title = f"[DUPLICATE] {original_incident.title}"
        new_incident.status = None
        new_incident.agent = None
        new_incident.save()
        serializer = self.get_serializer(new_incident)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['groups__name'] 
    search_fields = ['first_name', 'last_name', 'email'] 

    def get_queryset(self):
        return User.objects.all().order_by('first_name', 'last_name')

    @action(detail=False, methods=['get'], url_path='employees')
    def employees(self, request):
        employees = User.objects.filter(groups__name="Employee").order_by('first_name', 'last_name')
        serializer = self.get_serializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='it-staff')
    def it_staff(self, request):
        print("DEBUG: UserViewSet.it_staff called")
        it_staff = User.objects.filter(groups__name="IT Staff").order_by('first_name', 'last_name')
        print(f"DEBUG: Found {it_staff.count()} IT Staff users")
        serializer = self.get_serializer(it_staff, many=True)
        return Response(serializer.data)

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.groups.filter(name='IT Staff').exists():
            return Asset.objects.all()
        return Asset.objects.none()
    
class UserNoteViewSet(viewsets.ModelViewSet):
    queryset = UserNote.objects.all().order_by('-created_at')
    serializer_class = UserNoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user_profile']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)