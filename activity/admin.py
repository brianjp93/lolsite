from django.contrib import admin

from activity.models import Application, ApplicationToken, Heartrate


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    pass


@admin.register(ApplicationToken)
class ApplicationTokenAdmin(admin.ModelAdmin):
    raw_id_fields = ["user"]


@admin.register(Heartrate)
class HeartrateAdmin(admin.ModelAdmin):
    raw_id_fields = ["user"]
    list_display = ["user", "dt", "bpm"]
