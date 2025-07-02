from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import Incident, Attachment, Asset, ActivityLog, StatusLabel, UserNote
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['groups'] = [group.name for group in user.groups.all()]
        token['is_superuser'] = user.is_superuser
        return token

    def validate(self, attrs):
        user = User.objects.filter(email=attrs.get('username')).first()
        if user:
            attrs['username'] = user.username
        data = super().validate(attrs)
        return data

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['name']

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'groups', 'is_superuser']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_at']

class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'activity_type', 'old_value', 'new_value', 'note', 'timestamp']

class StatusLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusLabel
        fields = ['id', 'name', 'color']

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username']

class IncidentSerializer(serializers.ModelSerializer):
    # Explicitly define nested serializers for reliability
    status = StatusLabelSerializer(read_only=True)
    agent = AgentSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    activity_log = ActivityLogSerializer(many=True, read_only=True)
    
    # Use PrimaryKeyRelatedField for writing updates
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=StatusLabel.objects.all(), source='status', write_only=True, required=False
    )
    agent_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='agent', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Incident
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'submitted_at',
            'requester_name', 'requester_email', 
            'agent', # For reading the agent object
            'agent_id', # For writing the agent ID
            'source', 'urgency', 'impact', 'group', 'department', 'category', 'subcategory', 'tags',
            'attachments', 'activity_log', 'status_id', 'due_date', 'first_response_at', 'resolved_at'
        ]

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'], email=validated_data['email'], password=validated_data['password'],
            first_name=validated_data['first_name'], last_name=validated_data['last_name'], is_active=False
        )
        return user
    
class UserNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = UserNote
        fields = ['id', 'user_profile', 'author', 'author_name', 'note', 'created_at']
        read_only_fields = ['author']