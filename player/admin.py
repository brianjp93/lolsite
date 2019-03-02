from django.contrib import admin
from .models import Summoner, NameChange


class SummonerAdmin(admin.ModelAdmin):
    list_display = ('name', '_id', 'account_id')
    search_fields = ('name', 'simple_name', 'account_id', '_id', 'puuid')


class NameChangeAdmin(admin.ModelAdmin):
    list_display = ('summoner', 'old_name', 'created_date')
    search_fields = ('old_name', 'summoner__name', 'summoner__simple_name')


admin.site.register(Summoner, SummonerAdmin)
admin.site.register(NameChange, NameChangeAdmin)
