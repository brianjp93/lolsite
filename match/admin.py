from django.contrib import admin
from player.admin import CachedCountPaginator

from .models import Match, Participant, Stats
from .models import Team, Ban

from .models import AdvancedTimeline, Frame, ParticipantFrame
from .models import EliteMonsterKillEvent


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ("_id", "game_creation_dt", "queue_id", "game_version")
    list_filter = ("platform_id", "major")
    search_fields = (
        "participants__summoner_name_simplified",
        "participants__summoner_id",
        "_id",
    )
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("_id", "riot_id_name", "champion_id", "team_position", "team_id")
    raw_id_fields = ("match",)
    list_filter = ('team_position',)
    search_fields = ("riot_id_name", "match___id")
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(Stats)
class StatsAdmin(admin.ModelAdmin):
    list_display = ("participant",)
    raw_id_fields = ("participant",)
    search_fields = ("participant__match___id", "participant__summoner_name")
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("_id", "match", "win")
    raw_id_fields = ("match",)
    search_fields = ("match___id",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(Ban)
class BanAdmin(admin.ModelAdmin):
    list_display = ("team", "champion_id", "pick_turn")
    raw_id_fields = ("team",)
    search_fields = ("team__match___id",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


# ADVANCEDTIMELINE STUFF


@admin.register(AdvancedTimeline)
class AdvancedTimelineAdmin(admin.ModelAdmin):
    list_display = ("match",)
    raw_id_fields = ("match",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(Frame)
class FrameAdmin(admin.ModelAdmin):
    list_display = ("timestamp",)
    search_fields = ("timeline__match___id",)
    raw_id_fields = ("timeline",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(ParticipantFrame)
class ParticipantFrameAdmin(admin.ModelAdmin):
    list_display = ("participant_id",)
    search_fields = ("frame__timeline__match___id",)
    raw_id_fields = ("frame",)
    show_full_result_count = False
    list_per_page = 30
    paginator = CachedCountPaginator


@admin.register(EliteMonsterKillEvent)
class EliteMonsterKillEventAdmin(admin.ModelAdmin):
    list_display = ('killer_id', 'monster_type', 'x', 'y')
    search_fields = ('frame__timeline__match___id',)
