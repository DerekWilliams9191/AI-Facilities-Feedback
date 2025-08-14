from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'location', 'category', 'status', 'priority', 'user_email', 'manual_review', 'created_at']
    list_filter = ['status', 'priority', 'category', 'manual_review', 'created_at']
    search_fields = ['id', 'description', 'location', 'user_email']
    list_editable = ['status', 'priority', 'manual_review']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'description', 'location', 'category', 'user_email')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'manual_review', 'duplicate_of')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('duplicate_of')
