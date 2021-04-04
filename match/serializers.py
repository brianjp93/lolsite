from rest_framework import serializers
from .models import (
    Match, Participant, Stats,
    Timeline, Team, Ban,
    AdvancedTimeline, Frame, ParticipantFrame,
    Event, AssistingParticipants,
)
from match import tasks as mt

from data.serializers import (
    BasicChampionWithImageSerializer, ItemImageSerializer,
)

from django.db.models import QuerySet
from django.core.cache import cache


CACHE_TIME = 60 * 60 * 48


class MatchSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = "__all__"

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
    item_0_image = serializers.SerializerMethodField()
    item_1_image = serializers.SerializerMethodField()
    item_2_image = serializers.SerializerMethodField()
    item_3_image = serializers.SerializerMethodField()
    item_4_image = serializers.SerializerMethodField()
    item_5_image = serializers.SerializerMethodField()
    item_6_image = serializers.SerializerMethodField()
    perk_0_image_url = serializers.SerializerMethodField()
    perk_sub_style_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Stats
        fields = "__all__"

    def __init__(self, instance=None, extra=None, **kwargs):
        extra = extra or {}
        self.items = extra.get('items', {})
        self.perk_substyles = extra.get('perk_substyles', {})
        self.runes = extra.get('runes', {})
        super().__init__(instance=instance, **kwargs)

    def get_perk_0_image_url(self, obj):
        rune = self.runes.get(obj.perk_0, '')
        if rune:
            return rune.image_url()
        return ''

    def get_item_0_image(self, obj):
        item = self.items.get(obj.item_0)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_1_image(self, obj):
        item = self.items.get(obj.item_1)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_2_image(self, obj):
        item = self.items.get(obj.item_2)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_3_image(self, obj):
        item = self.items.get(obj.item_3)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_4_image(self, obj):
        item = self.items.get(obj.item_4)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_5_image(self, obj):
        item = self.items.get(obj.item_5)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_6_image(self, obj):
        item = self.items.get(obj.item_6)
        if item:
            return ItemImageSerializer(item.image).data

    def get_perk_sub_style_image_url(self, obj):
        return self.perk_substyles.get(obj.perk_sub_style, '')


class TimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeline
        fields = "__all__"


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            '_id',
            'baron_kills',
            'dragon_kills',
            'first_baron',
            'first_blood',
            'first_dragon',
            'first_inhibitor',
            'first_rift_herald',
            'first_tower',
            'inhibitor_kills',
            'rift_herald_kills',
            'tower_kills',
            'win',
            'win_str',
        ]


class BanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ban
        fields = "__all__"


class FullParticipantSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    timelines = TimelineSerializer(many=True, read_only=True)
    champion = serializers.SerializerMethodField()
    spell_1_image = serializers.SerializerMethodField()
    spell_2_image = serializers.SerializerMethodField()

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
        self.champs = self.extra.get('champs', {})
        self.runes = self.extra.get('runes', {})
        self.items = self.extra.get('items', {})
        self.perk_substyles = self.extra.get('perk_substyles', {})
        super().__init__(instance=instance, **kwargs)

    def get_champion(self, obj):
        ret = None
        champ = self.champs.get(obj.champion_id)
        if champ:
            ret = BasicChampionWithImageSerializer(champ).data
        return ret

    def get_stats(self, obj):
        return StatsSerializer(obj.stats, extra=self.extra).data

    def get_spell_1_image(self, obj):
        return self.spell_images.get(obj.spell_1_id, '')

    def get_spell_2_image(self, obj):
        return self.spell_images.get(obj.spell_2_id, '')


class FullTeamSerializer(serializers.ModelSerializer):
    bans = BanSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = "__all__"


class FullMatchSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    teams = FullTeamSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = "__all__"

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.prefetch_related(
                'participants', 'teams', 'participants__stats',
                'participants__timelines',
            )
        return super().__new__(cls, instance, *args, **kwargs)

    def __init__(self, instance=None, **kwargs):
        self.extra = {}
        match_qs = None
        if hasattr(instance, 'major'):
            match_qs = Match.objects.filter(id=instance.id)
        if match_qs:
            self.extra = match_qs.get_related()
        super().__init__(instance, **kwargs)

    def get_participants(self, obj):
        return FullParticipantSerializer(obj.participants.all(), many=True, extra=self.extra).data

    def to_representation(self, instance):
        """Override to use cache
        """
        cache_key = f'fullmatch/{instance.id}'
        data = cache.get(cache_key)
        if not data:
            data = super().to_representation(instance)
            cache.set(cache_key, data, CACHE_TIME)
        return data


class ParticipantFrameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantFrame
        fields = "__all__"


class AssistingParticipantsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistingParticipants
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    assistingparticipants = AssistingParticipantsSerializer(many=True)

    class Meta:
        model = Event
        fields = "__all__"

    def __new__(cls, instance=None, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.prefetch_related('assistingparticipants')
        return super().__new__(cls, instance, *args, **kwargs)


class FrameSerializer(serializers.ModelSerializer):
    participantframes = ParticipantFrameSerializer(many=True)
    events = EventSerializer(many=True)

    class Meta:
        model = Frame
        fields = "__all__"

    def __new__(cls, instance=None, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.prefetch_related(
                "participantframes", "events", "events__assistingparticipants"
            ).order_by('timestamp')
        return super().__new__(cls, instance, *args, **kwargs)


# ADVANCED TIMELINE
class AdvancedTimelineSerializer(serializers.ModelSerializer):
    frames = serializers.SerializerMethodField()

    class Meta:
        model = AdvancedTimeline
        fields = "__all__"

    def get_frames(self, obj):
        return FrameSerializer(obj.frames.all(), many=True).data

    def to_representation(self, instance):
        cache_key = f'advancedtimeline/{instance.id}'
        data = cache.get(cache_key)
        if not data:
            data = super().to_representation(instance)
            cache.set(cache_key, data, CACHE_TIME)
        return data


class BasicStatsSerializer(serializers.ModelSerializer):
    item_0_image = serializers.SerializerMethodField()
    item_1_image = serializers.SerializerMethodField()
    item_2_image = serializers.SerializerMethodField()
    item_3_image = serializers.SerializerMethodField()
    item_4_image = serializers.SerializerMethodField()
    item_5_image = serializers.SerializerMethodField()
    item_6_image = serializers.SerializerMethodField()
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
            'item_0_image', 'item_1_image', 'item_2_image',
            'item_3_image', 'item_4_image', 'item_5_image',
            'item_6_image', 'perk_0_image_url', 'perk_sub_style_image_url',
        ]

    def __init__(self, instance=None, extra=None, **kwargs):
        self.extra = extra or {}
        self.items = self.extra.get('items', {})
        self.runes = self.extra.get('runes', {})
        self.perk_substyles = self.extra.get('perk_substyles', {})
        super().__init__(instance=instance, **kwargs)

    def get_perk_0_image_url(self, obj):
        rune = self.runes.get(obj.perk_0, {})
        if rune:
            return rune.image_url()
        return ''

    def get_perk_sub_style_image_url(self, obj):
        return self.perk_substyles.get(obj.perk_sub_style)

    def get_item_0_image(self, obj):
        item = self.items.get(obj.item_0)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_1_image(self, obj):
        item = self.items.get(obj.item_1)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_2_image(self, obj):
        item = self.items.get(obj.item_2)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_3_image(self, obj):
        item = self.items.get(obj.item_3)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_4_image(self, obj):
        item = self.items.get(obj.item_4)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_5_image(self, obj):
        item = self.items.get(obj.item_5)
        if item:
            return ItemImageSerializer(item.image).data

    def get_item_6_image(self, obj):
        item = self.items.get(obj.item_6)
        if item:
            return ItemImageSerializer(item.image).data


class BasicParticipantSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    spell_1_image = serializers.SerializerMethodField()
    spell_2_image = serializers.SerializerMethodField()
    champion = serializers.SerializerMethodField()

    class Meta:
        model = Participant
        fields = [
            "_id",
            "summoner_name",
            "current_account_id",
            "account_id",
            "summoner_id",
            "lane",
            "role",
            "team_id",
            "spell_1_id",
            "spell_1_image",
            "spell_2_id",
            "spell_2_image",
            "champion",
            "stats",
        ]

    def __init__(self, instance=None, extra=None, **kwargs):
        self.extra = extra or {}
        self.spell_images = self.extra.get('spell_images', {})
        self.champs = self.extra.get('champs', {})
        self.items = self.extra.get('items', {})
        super().__init__(instance=instance, **kwargs)

    def get_stats(self, obj):
        return BasicStatsSerializer(obj.stats, extra=self.extra).data

    def get_spell_1_image(self, obj):
        return self.spell_images.get(obj.spell_1_id, '')

    def get_spell_2_image(self, obj):
        return self.spell_images.get(obj.spell_2_id, '')

    def get_champion(self, obj):
        ret = {}
        champ = self.champs.get(obj.champion_id)
        if champ:
            ret = BasicChampionWithImageSerializer(champ).data
        return ret


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
