from django.contrib import admin
from .models import Summoner, NameChange


class SummonerAdmin(admin.ModelAdmin):
    list_display = ('name', '_id', 'account_id')


class NameChangeAdmin(admin.ModelAdmin):
    list_display = ('summoner', 'old_name', 'created_date')


admin.site.register(Summoner, SummonerAdmin)
admin.site.register(NameChange, NameChangeAdmin)
