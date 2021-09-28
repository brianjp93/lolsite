from django.contrib import admin
from player.admin import CachedCountPaginator

from .models import Match, Participant, Stats
from .models import Team, Ban

from .models import AdvancedTimeline, Frame, ParticipantFrame


class MatchAdmin(admin.ModelAdmin):
    list_display = ("_id", "get_creation", "queue_id", "game_version")
    list_filter = ("platform_id", "major")
    search_fields = (
        "participants__summoner_name_simplified",
        "participants__summoner_id",
        "_id",
    )
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("_id", "summoner_name_simplified", "champion_id", "team_id")
    raw_id_fields = ("match",)
    search_fields = ("summoner_name_simplified", "match___id")
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class StatsAdmin(admin.ModelAdmin):
    list_display = ("participant",)
    raw_id_fields = ("participant",)
    search_fields = ("participant__match___id", "participant__summoner_name")
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class TeamAdmin(admin.ModelAdmin):
    list_display = ("_id", "match", "win")
    raw_id_fields = ("match",)
    search_fields = ("match___id",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class BanAdmin(admin.ModelAdmin):
    list_display = ("team", "champion_id", "pick_turn")
    raw_id_fields = ("team",)
    search_fields = ("team__match___id",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


# ADVANCEDTIMELINE STUFF


class AdvancedTimelineAdmin(admin.ModelAdmin):
    list_display = ("match",)
    raw_id_fields = ("match",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class FrameAdmin(admin.ModelAdmin):
    list_display = ("timestamp",)
    search_fields = ("timeline__match___id",)
    raw_id_fields = ("timeline",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


class ParticipantFrameAdmin(admin.ModelAdmin):
    list_display = ("participant_id",)
    search_fields = ("frame__timeline__match___id",)
    raw_id_fields = ("frame",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


admin.site.register(Match, MatchAdmin)
admin.site.register(Participant, ParticipantAdmin)
admin.site.register(Stats, StatsAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Ban, BanAdmin)
admin.site.register(AdvancedTimeline, AdvancedTimelineAdmin)
admin.site.register(Frame, FrameAdmin)
admin.site.register(ParticipantFrame, ParticipantFrameAdmin)
