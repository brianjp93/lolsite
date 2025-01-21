from django.contrib import admin

from activity.models import Application, ApplicationToken


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    pass


@admin.register(ApplicationToken)
class ApplicationTokenAdmin(admin.ModelAdmin):
    raw_id_fields = ["user"]
