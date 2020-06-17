from django.contrib import admin

from .models import InspirationalMessage


class InspirationalMessageAdmin(admin.ModelAdmin):
    list_display = ("message", "created_date", "is_active")


admin.site.register(InspirationalMessage, InspirationalMessageAdmin)
