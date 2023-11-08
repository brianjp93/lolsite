from rest_framework import serializers
from .models import (
    Match, MatchSummary, Participant, Stats, Team, Ban,
    AdvancedTimeline, Frame, ParticipantFrame,
)
from . import models
from match import tasks as mt

from django.db.models import QuerySet
from django.core.cache import cache

import logging

logger = logging.getLogger(__name__)
CACHE_TIME = 60 * 60 * 48


class MatchSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'id',
            '_id',
            'game_creation',
            'game_duration',
            'game_mode',
            'game_type',
            'map_id',
            'platform_id',
            'season_id',
            'game_version',
            'build',
            'major',
            'minor',
            'patch',
            'url',
            'queue_id',
        ]

    def __init__(self, *args, summoner_name=None, **kwargs):
        self.summoner_name = summoner_name
        super().__init__(*args, **kwargs)

    def get_url(self, obj):
        return obj.get_absolute_url(pname=self.summoner_name)


class ParticipantSerializer(serializers.ModelSerializer):
    perk_sub_style_image_url = serializers.CharField()

    class Meta:
        model = Participant
        fields = "__all__"


class StatsSerializer(serializers.ModelSerializer):
    perk_0_image_url = serializers.SerializerMethodField()
    perk_sub_style_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Stats
        fields = [
            'perk_0_image_url',
            'perk_sub_style_image_url',
            'participant',
            'assists',
            'champ_level',
            'damage_dealt_to_objectives',
            'damage_dealt_to_turrets',
            'damage_self_mitigated',
            'deaths',
            'double_kills',
            'first_blood_assist',
            'first_blood_kill',
            'first_tower_assist',
            'first_tower_kill',
            'gold_earned',
            'gold_spent',
            'inhibitor_kills',
            'item_0',
            'item_1',
            'item_2',
            'item_3',
            'item_4',
            'item_5',
            'item_6',
            'killing_sprees',
            'kills',
            'largest_critical_strike',
            'largest_killing_spree',
            'largest_multi_kill',
            'longest_time_spent_living',
            'magic_damage_dealt',
            'magic_damage_dealt_to_champions',
            'magical_damage_taken',
            'neutral_minions_killed',
            'penta_kills',
            'perk_0',
            'perk_0_var_1',
            'perk_0_var_2',
            'perk_0_var_3',
            'perk_1',
            'perk_1_var_1',
            'perk_1_var_2',
            'perk_1_var_3',
            'perk_2',
            'perk_2_var_1',
            'perk_2_var_2',
            'perk_2_var_3',
            'perk_3',
            'perk_3_var_1',
            'perk_3_var_2',
            'perk_3_var_3',
            'perk_4',
            'perk_4_var_1',
            'perk_4_var_2',
            'perk_4_var_3',
            'perk_5',
            'perk_5_var_1',
            'perk_5_var_2',
            'perk_5_var_3',
            'perk_primary_style',
            'perk_sub_style',
            'physical_damage_dealt',
            'physical_damage_dealt_to_champions',
            'physical_damage_taken',
            'quadra_kills',
            'sight_wards_bought_in_game',
            'stat_perk_0',
            'stat_perk_1',
            'stat_perk_2',
            'spell_1_casts',
            'spell_2_casts',
            'spell_3_casts',
            'spell_4_casts',
            'time_ccing_others',
            'total_damage_dealt',
            'total_damage_dealt_to_champions',
            'total_damage_taken',
            'total_heal',
            'total_heals_on_teammates',
            'total_damage_shielded_on_teammates',
            'total_minions_killed',
            'total_time_crowd_control_dealt',
            'total_units_healed',
            'total_ally_jungle_minions_killed',
            'total_enemy_jungle_minions_killed',
            'triple_kills',
            'true_damage_dealt',
            'true_damage_dealt_to_champions',
            'true_damage_taken',
            'turret_kills',
            'unreal_kills',
            'vision_score',
            'vision_wards_bought_in_game',
            'wards_killed',
            'wards_placed',
            'detector_wards_placed',
            'win',

            'all_in_pings',
            'assist_me_pings',
            'bait_pings',
            'basic_pings',
            'command_pings',
            'danger_pings',
            'enemy_missing_pings',
            'enemy_vision_pings',
            'get_back_pings',
            'hold_pings',
            'need_vision_pings',
            'on_my_way_pings',
            'push_pings',
            'vision_cleared_pings',
        ]

    def __init__(self, instance=None, extra=None, **kwargs):
        extra = extra or {}
        self.perk_substyles = extra.get('perk_substyles', {})
        self.runes = extra.get('runes', {})
        super().__init__(instance=instance, **kwargs)

    def get_perk_0_image_url(self, obj):
        rune = self.runes.get(obj.perk_0, '')
        if rune:
            return rune.image_url()
        return ''

    def get_perk_sub_style_image_url(self, obj):
        return self.perk_substyles.get(obj.perk_sub_style, '') or ''


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            '_id',
            'win',
        ]


class BanSerializer(serializers.ModelSerializer):
    team = serializers.SerializerMethodField()

    class Meta:
        model = Ban
        fields = [
            'pick_turn',
            'champion_id',
            'team',
        ]

    def get_team(self, obj):
        return obj.team._id


class FullParticipantSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    summoner_1_image = serializers.SerializerMethodField()
    summoner_2_image = serializers.SerializerMethodField()

    class Meta:
        model = Participant
        fields = "__all__"

    def __init__(self, instance=None, extra=None, **kwargs):
        self.extra = extra or {}
        if extra is None:
            match_qs = None
            if isinstance(instance, QuerySet):
                match_qs = Match.objects.filter(participants__in=instance)
            elif hasattr(instance, 'match'):
                match_qs = Match.objects.filter(id=instance.match.id)
            if match_qs:
                self.extra = match_qs.get_related()
        self.spell_images = self.extra.get('spell_images', {})
        self.runes = self.extra.get('runes', {})
        self.items = self.extra.get('items', {})
        self.perk_substyles = self.extra.get('perk_substyles', {})
        super().__init__(instance=instance, **kwargs)

    def get_stats(self, obj):
        return StatsSerializer(obj.stats, extra=self.extra).data

    def get_summoner_1_image(self, obj):
        return self.spell_images.get(obj.summoner_1_id, '')

    def get_summoner_2_image(self, obj):
        return self.spell_images.get(obj.summoner_2_id, '')


class FullTeamSerializer(serializers.ModelSerializer):
    bans = BanSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = [
            "_id",
            "win",
            "bans",
        ]


class FullMatchSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    teams = FullTeamSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = "__all__"

    def __init__(self, instance=None, **kwargs):
        self.extra = {}
        match_qs = None
        if hasattr(instance, 'major'):
            match_qs = Match.objects.filter(id=instance.id)
        if match_qs:
            self.extra = match_qs.get_related()
        elif isinstance(instance, models.QuerySet):
            self.extra = instance.get_related()
        super().__init__(instance, **kwargs)

    def get_participants(self, obj):
        parts = mt.get_sorted_participants(obj, participants=obj.participants.all())
        return FullParticipantSerializer(parts, many=True, extra=self.extra).data

    def to_representation(self, instance):
        """Override to use cache
        """
        cache_key = f'fullmatch/{instance.id}'
        data = cache.get(cache_key)
        if not data:
            data = super().to_representation(instance)
            logger.info('Caching FullMatchSerializer data.')
            cache.set(cache_key, data, CACHE_TIME)
        else:
            logger.info('Found cached data for FullMatchSerializer.')
        return data


class ParticipantFrameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantFrame
        fields = [
            'participant_id',
            'current_gold',
            'gold_per_second',
            'jungle_minions_killed',
            'level',
            'minions_killed',
            'team_score',
            'total_gold',
            'time_enemy_spent_controlled',
            'xp',
            'x',
            'y',

            'ability_haste',
            'ability_power',
            'armor',
            'armor_pen',
            'armor_pen_percent',
            'attack_damage',
            'attack_speed',
            'bonus_armor_pen_percent',
            'bonus_magic_pen_percent',
            'cc_reduction',
            'cooldown_reduction',
            'health',
            'health_max',
            'health_regen',
            'lifesteal',
            'magic_pen',
            'magic_pen_percent',
            'magic_resist',
            'movement_speed',
            'omnivamp',
            'physical_vamp',
            'power',
            'power_max',
            'power_regen',
            'spell_vamp',

            'magic_damage_done',
            'magic_damage_done_to_champions',
            'magic_damage_taken',
            'physical_damage_done',
            'physical_damage_done_to_champions',
            'physical_damage_taken',
            'total_damage_done',
            'total_damage_done_to_champions',
            'total_damage_taken',
            'true_damage_done',
            'true_damage_done_to_champions',
            'true_damage_taken',
        ]


class WardKillEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='WARD_KILL')

    class Meta:
        model = models.WardKillEvent
        fields = [
            'timestamp',
            'killer_id',
            'ward_type',
            '_type',
        ]


class WardPlacedEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='WARD_PLACED')

    class Meta:
        model = models.WardPlacedEvent
        fields = [
            'timestamp',
            'creator_id',
            'ward_type',
            '_type',
        ]


class LevelUpEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='LEVEL_UP')

    class Meta:
        model = models.LevelUpEvent
        fields = [
            'timestamp',
            'level',
            'participant_id',
            '_type',
        ]


class SkillLevelUpEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='SKILL_LEVEL_UP')

    class Meta:
        model = models.SkillLevelUpEvent
        fields = [
            'timestamp',
            'level_up_type',
            'participant_id',
            'skill_slot',
            '_type',
        ]


class ItemPurchasedEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='ITEM_PURCHASED')

    class Meta:
        model = models.ItemPurchasedEvent
        fields = [
            'timestamp',
            'item_id',
            'participant_id',
            '_type',
        ]


class ItemDestroyedEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='ITEM_DESTROYED')

    class Meta:
        model = models.ItemDestroyedEvent
        fields = [
            'timestamp',
            'item_id',
            'participant_id',
            '_type',
        ]


class ItemSoldEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='ITEM_SOLD')

    class Meta:
        model = models.ItemSoldEvent
        fields = [
            'timestamp',
            'item_id',
            'participant_id',
            '_type',
        ]


class ItemUndoEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='ITEM_UNDO')

    class Meta:
        model = models.ItemUndoEvent
        fields = [
            'timestamp',
            'participant_id',
            'before_id',
            'after_id',
            'gold_gain',
            '_type',
        ]


class TurretPlateDestroyedEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='TURRET_PLATE_DESTROYED')

    class Meta:
        model = models.TurretPlateDestroyedEvent
        fields = [
            'timestamp',
            'killer_id',
            'lane_type',
            'x',
            'y',
            'team_id',
            '_type',
        ]


class EliteMonsterKillEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='ELITE_MONSTER_KILL')

    class Meta:
        model = models.EliteMonsterKillEvent
        fields = [
            'bounty',
            'timestamp',
            'killer_id',
            'assisting_participant_ids',
            'killer_team_id',
            'monster_type',
            'monster_sub_type',
            'x',
            'y',
            '_type',
        ]


class ChampionSpecialKillEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='CHAMPION_SPECIAL_KILL')

    class Meta:
        model = models.ChampionSpecialKillEvent
        fields = [
            'timestamp',
            'assisting_participant_ids',
            'kill_type',
            'killer_id',
            'multi_kill_length',
            'x',
            'y',
            '_type',
        ]


class BuildingKillEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='BUILDING_KILL')

    class Meta:
        model = models.BuildingKillEvent
        fields = [
            'timestamp',
            'bounty',
            'assisting_participant_ids',
            'building_type',
            'killer_id',
            'lane_type',
            'team_id',
            'tower_type',
            'x',
            'y',
            '_type',
        ]


class VictimDamageDealtSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VictimDamageDealt
        fields = [
            'basic',
            'magic_damage',
            'name',
            'participant_id',
            'physical_damage',
            'spell_name',
            'spell_slot',
            'true_damage',
            'type',
        ]


class VictimDamageReceivedSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VictimDamageReceived
        fields = [
            'basic',
            'magic_damage',
            'name',
            'participant_id',
            'physical_damage',
            'spell_name',
            'spell_slot',
            'true_damage',
            'type',
        ]


class ChampionKillEventSerializer(serializers.ModelSerializer):
    _type = serializers.ReadOnlyField(default='CHAMPION_KILL')
    victimdamagedealt_set = VictimDamageDealtSerializer(many=True)
    victimdamagereceived_set = VictimDamageReceivedSerializer(many=True)

    class Meta:
        model = models.ChampionKillEvent
        fields = [
            'timestamp',
            'bounty',
            'shutdown_bounty',
            'kill_streak_length',
            'killer_id',
            'victim_id',
            'x',
            'y',

            'victimdamagereceived_set',
            'victimdamagedealt_set',
            '_type',
        ]


class FrameSerializer(serializers.ModelSerializer):
    participantframes = ParticipantFrameSerializer(many=True)
    wardkillevents = WardKillEventSerializer(many=True, source='wardkillevent_set')
    wardplacedevents = WardPlacedEventSerializer(many=True, source='wardplacedevent_set')
    levelupevents = LevelUpEventSerializer(many=True, source='levelupevent_set')
    skilllevelupevents = SkillLevelUpEventSerializer(many=True, source='skilllevelupevent_set')
    itempurchaseevents = ItemPurchasedEventSerializer(many=True, source='itempurchasedevent_set')
    itemdestroyedevents = ItemDestroyedEventSerializer(many=True, source='itemdestroyedevent_set')
    itemundoevents = ItemUndoEventSerializer(many=True, source='itemundoevent_set')
    itemsoldevents = ItemSoldEventSerializer(many=True, source='itemsoldevent_set')
    turretplatedestroyedevents = TurretPlateDestroyedEventSerializer(
        many=True,
        source='turretplatedestroyedevent_set',
    )
    elitemonsterkillevents = EliteMonsterKillEventSerializer(many=True, source='elitemonsterkillevent_set')
    championspecialkillevents = ChampionSpecialKillEventSerializer(
        many=True,
        source='championspecialkillevent_set',
    )
    buildingkillevents = BuildingKillEventSerializer(many=True, source='buildingkillevent_set')
    championkillevents = ChampionKillEventSerializer(many=True, source='championkillevent_set')

    class Meta:
        model = Frame
        fields = [
            'timestamp',
            'participantframes',
            'wardkillevents',
            'wardplacedevents',
            'levelupevents',
            'skilllevelupevents',
            'itempurchaseevents',
            'itemdestroyedevents',
            'itemsoldevents',
            'itemundoevents',
            'turretplatedestroyedevents',
            'elitemonsterkillevents',
            'championspecialkillevents',
            'buildingkillevents',
            'championkillevents',
        ]

    def __new__(cls, instance=None, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.order_by('timestamp')
        return super().__new__(cls, instance, *args, **kwargs)


# ADVANCED TIMELINE
class AdvancedTimelineSerializer(serializers.ModelSerializer):
    frames = FrameSerializer(many=True, read_only=True)

    class Meta:
        model = AdvancedTimeline
        fields = [
            'frame_interval',
            'frames',
        ]

    def to_representation(self, instance):
        cache_key = f'advancedtimeline/{instance.id}'
        data = cache.get(cache_key)
        if not data:
            data = super().to_representation(instance)
            cache.set(cache_key, data, CACHE_TIME)
        return data


class BasicStatsSerializer(serializers.ModelSerializer):
    perk_0_image_url = serializers.SerializerMethodField()
    perk_sub_style_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Stats
        fields = [
            "kills", "deaths", "assists",
            "champ_level", "total_damage_dealt_to_champions", "vision_score",
            "total_damage_taken", "damage_dealt_to_objectives", "damage_dealt_to_turrets",
            "gold_earned", "total_heal", "time_ccing_others",
            "item_0", "item_1", "item_2",
            "item_3", "item_4", "item_5", "item_6",
            'perk_0_image_url', 'perk_sub_style_image_url',
        ]

    def __init__(self, instance=None, extra=None, **kwargs):
        self.extra = extra or {}
        self.runes = self.extra.get('runes', {})
        self.perk_substyles = self.extra.get('perk_substyles', {})
        super().__init__(instance=instance, **kwargs)

    def get_perk_0_image_url(self, obj):
        rune = self.runes.get(obj.perk_0, {})
        if rune:
            return rune.image_url()
        return ''

    def get_perk_sub_style_image_url(self, obj):
        return self.perk_substyles.get(obj.perk_sub_style) or ''


class BasicParticipantSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    summoner_1_image = serializers.SerializerMethodField()
    summoner_2_image = serializers.SerializerMethodField()

    class Meta:
        model = Participant
        fields = [
            "_id",
            "summoner_name",
            "puuid",
            "summoner_id",
            "lane",
            "role",
            "team_id",
            "summoner_1_id",
            "summoner_1_image",
            "summoner_2_id",
            "summoner_2_image",
            "champion_id",
            "stats",
            "team_position",
            "placement",
            "subteam_placement",
        ]

    def __init__(self, instance=None, extra=None, **kwargs):
        self.extra = extra or {}
        self.spell_images = self.extra.get('spell_images', {})
        super().__init__(instance=instance, **kwargs)

    def get_stats(self, obj):
        return BasicStatsSerializer(obj.stats, extra=self.extra).data

    def get_summoner_1_image(self, obj):
        return self.spell_images.get(obj.summoner_1_id, '')

    def get_summoner_2_image(self, obj):
        return self.spell_images.get(obj.summoner_2_id, '')


class BasicMatchSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    teams = TeamSerializer(many=True)

    class Meta:
        model = Match
        fields = [
            "id", "_id", "game_duration",
            "game_creation", "queue_id", "major",
            "minor", "participants", "teams"
        ]

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.prefetch_related(
                'participants', 'participants__stats', 'teams',
            )
        return super().__new__(cls, instance, *args, **kwargs)

    def __init__(self, instance=None, **kwargs):
        self.extra = None
        if isinstance(instance, QuerySet):
            self.extra = instance.get_related()
        super().__init__(instance=instance, **kwargs)

    def get_participants(self, obj):
        parts = mt.get_sorted_participants(obj, participants=obj.participants.all())
        return BasicParticipantSerializer(parts, many=True, extra=self.extra).data

    def to_representation(self, instance):
        cache_key = f'basicmatch/{instance.id}'
        data = cache.get(cache_key)
        if not data:
            data = super().to_representation(instance)
            cache.set(cache_key, data, CACHE_TIME)
        return data


class LlmStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        fields = [
            "assists",
            "champ_level",
            "damage_dealt_to_turrets",
            "damage_dealt_to_objectives",
            "gold_earned",
            "kills",
            "deaths",
            "damage_self_mitigated",
            "time_ccing_others",
            "total_heal",
            "total_heals_on_teammates",
            "total_time_crowd_control_dealt",
            "win",
            "vision_score",
        ]

class LlmParticipantSerializer(serializers.ModelSerializer):
    stats = LlmStatsSerializer(many=False)

    class Meta:
        model = Participant
        fields = [
            "id",
            "summoner_name",
            "lane",
            "role",
            "individual_position",
            "team_position",

            "stats",
        ]

class LlmParticipantFrames(serializers.ModelSerializer):
    class Meta:
        model = ParticipantFrame
        fields = [
            "participant_id",
            "jungle_minions_killed",
            "total_gold",
            "xp",
            "total_damage_done_to_champions",
            "total_damage_taken",
            "movement_speed",
        ]

class LlmFrameSerializer(serializers.ModelSerializer):
    participantframes = LlmParticipantFrames(many=True)
    turretplatedestroyedevent_set = TurretPlateDestroyedEventSerializer(many=True)
    elitemonsterkillevent_set = EliteMonsterKillEventSerializer(many=True)
    buildingkillevent_set = BuildingKillEventSerializer(many=True)

    class Meta:
        model = Frame
        fields = [
            "timestamp",
            "participantframes",
            "turretplatedestroyedevent_set",
            "elitemonsterkillevent_set",
            "buildingkillevent_set",
        ]

class LlmTimelineSerializer(serializers.ModelSerializer):
    frames = LlmFrameSerializer(many=True)

    class Meta:
        model = AdvancedTimeline
        fields = [
            "frames"
        ]

class LlmMatchSerializer(serializers.ModelSerializer):
    participants = LlmParticipantSerializer(many=True)
    teams = TeamSerializer(many=True)
    advancedtimeline = LlmTimelineSerializer(many=False)

    class Meta:
        model = Match
        fields = [
            "game_duration",
            "game_creation",
            "queue_id",
            "major",
            "minor",
            "participants",
            "teams",
            "advancedtimeline",
        ]


class MatchSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchSummary
        fields = [
            "content",
        ]
