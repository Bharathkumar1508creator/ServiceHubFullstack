from django.contrib import admin

# registering models in python
from .models import (
    ChatbotInteraction,
    ContactMessage,
    Service,
    ServiceProvider,
)

# Register your models here.
admin.site.register(Service)
# service provider model admin panel-la display panna vendiya fields
admin.site.register(ServiceProvider)

@admin.register(ChatbotInteraction)
class ChatbotInteractionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'display_name',
        'username',
        'user_role',
        'session_id',
        'question_preview',
        'answer_preview',
    )
    list_filter = ('user_role', 'created_at')
    search_fields = (
        'username',
        'display_name',
        'question',
        'answer',
    )
    readonly_fields = (
        'user',
        'username',
        'display_name',
        'user_role',
        'session_id',
        'question',
        'answer',
        'created_at',
    )

    @admin.display(description='Question')
    def question_preview(self, interaction):
        return interaction.question[:80]

    @admin.display(description='Answer')
    def answer_preview(self, interaction):
        return interaction.answer[:80]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'email',
        'topic',
        'status',
        'created_at',
    )
    list_filter = ('status', 'topic', 'created_at')
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('created_at',)