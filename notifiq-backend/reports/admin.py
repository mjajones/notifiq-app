from django.contrib import admin
from .models import Incident, Asset, Attachment, StatusLabel, ActivityLog

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'agent', 'submitted_at')
    list_filter = ('status', 'priority', 'agent')
    search_fields = ('title', 'description', 'requester_name')

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_type', 'tag', 'department', 'managed_by')
    list_filter = ('asset_type', 'department', 'managed_by_group')
    search_fields = ('name', 'tag', 'description')

admin.site.register(Attachment)
admin.site.register(StatusLabel)
admin.site.register(ActivityLog)