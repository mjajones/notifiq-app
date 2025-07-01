from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class StatusLabel(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#808080')  # Store hex color e.g., #FF0000

    def __str__(self):
        return self.name

class Incident(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.ForeignKey(StatusLabel, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=50, default='Medium')
    submitted_at = models.DateTimeField(auto_now_add=True)
    requester_name = models.CharField(max_length = 100, blank = True, help_text = "Name of the person requesting help")
    requester_email = models.EmailField(max_length = 100, blank = True)

    agent = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_incidents',
        help_text="The IT support agent assigned to this ticket"
    )

    source = models.CharField(max_length=20, default='phone')
    urgency = models.CharField(max_length=10, default='low')
    impact = models.CharField(max_length=10, default='low')
    group = models.CharField(max_length=50, default='Level 1 Helpdesk')
    department = models.CharField(max_length=50, default='IT')
    category = models.CharField(max_length=50, blank=True)
    subcategory = models.CharField(max_length=50, blank=True)
    due_date = models.DateTimeField(blank=True, null=True)
    watching_by = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    tags = models.JSONField(default = list, blank = True)
    due_date = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title
    
# File attachments
class Attachment(models.Model):
    incident = models.ForeignKey(Incident, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

class Asset(models.Model):
    name = models.CharField(max_length=200)
    tag = models.CharField(max_length=100, blank=True, null=True, unique=True)
    asset_type = models.CharField(max_length=100)
    impact = models.CharField(max_length=50, default='Low')
    description = models.TextField(blank=True, null=True)
    end_of_life = models.DateField(blank=True, null=True)
    
    # Assignment Fields
    location = models.CharField(max_length=100, default='US')
    department = models.CharField(max_length=100, blank=True)
    managed_by_group = models.CharField(max_length=100, blank=True)
    managed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='managed_assets'
    )

    def __str__(self):
        return self.file.name
    
class ActivityLog(models.Model):
    incident = models.ForeignKey(Incident, related_name='activity_log', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=50)  # e.g., 'Note Added', 'Status Changed'
    old_value = models.CharField(max_length=100, blank=True, null=True)
    new_value = models.CharField(max_length=100, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp'] 

    def __str__(self):
        return f'{self.activity_type} on Incident {self.incident.id}'
    
class UserNote(models.Model):
    user_profile = models.ForeignKey(User, related_name='notes_about_user', on_delete=models.CASCADE) # The user the note is about
    author = models.ForeignKey(User, related_name='authored_user_notes', on_delete=models.CASCADE) # The IT staff member who wrote the note
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note about {self.user_profile.username} by {self.author.username}"
