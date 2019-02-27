from django.contrib import admin

from .models import Match, Participant, Stats
from .models import Timeline, Team, Ban


class MatchAdmin(admin.ModelAdmin):
    list_display = ('_id', 'get_creation', 'queue_id', 'game_version')
    list_filter = ('platform_id', 'major')
    search_fields = ('participants__summoner_name', 'participants__summoner_id', 'participants__account_id', '_id')


class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('_id', 'summoner_name', 'champion_id', 'team_id')
    raw_id_fields = ('match',)
    search_fields = ('summoner_name', 'match___id')


class StatsAdmin(admin.ModelAdmin):
    list_display = ('participant',)
    raw_id_fields = ('participant',)
    search_fields = ('participant__match___id', 'participant__summoner_name')


class TimelineAdmin(admin.ModelAdmin):
    list_display = ('key', 'start', 'end', 'value')
    raw_id_fields = ('participant',)


class TeamAdmin(admin.ModelAdmin):
    list_display = ('_id', 'match', 'win')
    raw_id_fields = ('match',)
    search_fields = ('match___id',)


class BanAdmin(admin.ModelAdmin):
    list_display = ('team', 'champion_id', 'pick_turn')
    raw_id_fields = ('team',)
    search_fields = ('team__match___id',)


admin.site.register(Match, MatchAdmin)
admin.site.register(Participant, ParticipantAdmin)
admin.site.register(Stats, StatsAdmin)
admin.site.register(Timeline, TimelineAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Ban, BanAdmin)
