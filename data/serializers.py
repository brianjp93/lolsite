from django.db.models import QuerySet
from rest_framework import serializers
from .models import (
    ProfileIcon, Item, ItemGold, ItemStat,
    ReforgedRune, Champion, ChampionSpell,
    ItemMap, ChampionStats, ChampionSpellVar,
    ItemImage, ChampionImage, SummonerSpellImage,
)


class DynamicSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop("fields", None)
        # Instantiate the superclass normally
        super(DynamicSerializer, self).__init__(*args, **kwargs)
        if fields:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields.keys())
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class ProfileIconSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = ProfileIcon
        fields = "__all__"


class ItemGoldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemGold
        fields = "__all__"


class ItemMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemMap
        fields = ['key', 'value']


class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = [
            'file',
            'file_15',
            'file_30',
            'file_40',
        ]


class ItemStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemStat
        fields = ['key', 'value']


class ItemSerializer(serializers.ModelSerializer):
    gold = ItemGoldSerializer()
    image = ItemImageSerializer()
    stats = serializers.SerializerMethodField()
    maps = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = "__all__"

    def get_maps(self, instance):
        return {x.key: x.value for x in instance.maps.all()}

    def get_stats(self, instance):
        return {x.key: x.value for x in instance.stats.all()}

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image', 'gold')
            instance = instance.prefetch_related('stats', 'maps')
        return super().__new__(cls, instance, *args, **kwargs)


class ReforgedRuneSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = ReforgedRune
        fields = "__all__"


class ChampionStatsSerializer(DynamicSerializer):
    class Meta:
        model = ChampionStats
        fields = "__all__"


class ChampionSpellVarSerializer(DynamicSerializer):
    class Meta:
        model = ChampionSpellVar
        fields = "__all__"


class ChampionSpellSerializer(DynamicSerializer):
    image_url = serializers.CharField()
    get_effect = serializers.ListField()
    vars = ChampionSpellVarSerializer(many=True)

    class Meta:
        model = ChampionSpell
        fields = "__all__"


class ChampionImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ChampionImage
        fields = [
            'file',
            'file_15',
            'file_30',
            'file_40',
        ]


class ChampionSerializer(DynamicSerializer):
    image = ChampionImageSerializer()
    stats = ChampionStatsSerializer()
    spells = ChampionSpellSerializer(many=True)

    class Meta:
        model = Champion
        fields = "__all__"

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image', 'stats')
            instance = instance.prefetch_related(
                'spells', 'spells__vars', 'spells__image',
                'spells__effect_burn',
            )
        return super().__new__(cls, instance, *args, **kwargs)


class BasicChampionWithImageSerializer(serializers.ModelSerializer):
    image = ChampionImageSerializer()

    class Meta:
        model = Champion
        fields = ['_id', 'name', 'image', 'key']

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image')
        return super().__new__(cls, instance, *args, **kwargs)


class SummonerSpellImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = SummonerSpellImage
        fields = ['image_url']
