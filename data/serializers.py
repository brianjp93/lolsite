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

    class Meta:  # type: ignore[override]
        model = ProfileIcon
        fields = "__all__"


class ItemGoldSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = ItemGold
        fields = "__all__"


class ItemMapSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = ItemMap
        fields = ['key', 'value']


class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = ItemImage
        fields = [
            'file',
            'file_15',
            'file_30',
            'file_40',
        ]


class ItemStatSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = ItemStat
        fields = ['key', 'value']


class ItemSerializer(serializers.ModelSerializer):
    gold = ItemGoldSerializer()
    image = ItemImageSerializer()
    stats = serializers.SerializerMethodField()
    maps = serializers.SerializerMethodField()
    stat_efficiency = serializers.SerializerMethodField()

    class Meta:  # type: ignore[override]
        model = Item
        fields = [
            'id',
            'gold',
            'image',
            'maps',
            'stat_efficiency',
            'major',
            'minor',
            'patch',
            '_id',
            'version',
            'language',
            'colloq',
            'description',
            'name',
            'plaintext',
            'required_ally',
            'required_champion',
            'in_store',
            'consumed',
            'consume_on_full',
            'last_changed',
            'stats',
            'diff',
            'stacks',
        ]

    def get_maps(self, instance):
        return {x.key: x.value for x in instance.maps.all()}

    def get_stats(self, instance):
        return {
            x: getattr(instance, x, None) for x in instance.stat_list
        }

    def get_stat_efficiency(self, instance):
        return instance.stat_efficiency

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image', 'gold')
            instance = instance.prefetch_related('maps')
        return super().__new__(cls, instance, *args, **kwargs)


class SimpleItemSerializer(serializers.ModelSerializer):
    gold = ItemGoldSerializer()
    image = ItemImageSerializer()

    class Meta:  # type: ignore[override]
        model = Item
        fields = (
            'id',
            'name',
            'description',
            '_id',
            'gold',
            'image',
        )


class ReforgedRuneSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:  # type: ignore[override]
        model = ReforgedRune
        fields = "__all__"


class ChampionStatsSerializer(DynamicSerializer):
    class Meta:  # type: ignore[override]
        model = ChampionStats
        fields = "__all__"


class ChampionSpellVarSerializer(DynamicSerializer):
    class Meta:  # type: ignore[override]
        model = ChampionSpellVar
        fields = "__all__"


class ChampionSpellSerializer(DynamicSerializer):
    image_url = serializers.CharField()
    get_effect = serializers.ListField()
    vars = ChampionSpellVarSerializer(many=True)

    class Meta:  # type: ignore[override]
        model = ChampionSpell
        fields = "__all__"


class ChampionImageSerializer(serializers.ModelSerializer):

    class Meta:  # type: ignore[override]
        model = ChampionImage
        fields = [
            'image_url',
            'file',
            'file_15',
            'file_30',
            'file_40',
        ]


class ChampionSerializer(DynamicSerializer):
    image = ChampionImageSerializer()
    stats = ChampionStatsSerializer()
    spells = ChampionSpellSerializer(many=True)

    class Meta:  # type: ignore[override]
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

    class Meta:  # type: ignore[override]
        model = Champion
        fields = ['_id', 'name', 'image', 'key']

    def __new__(cls, instance, *args, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image')
        return super().__new__(cls, instance, *args, **kwargs)


class SummonerSpellImageSerializer(serializers.ModelSerializer):

    class Meta:  # type: ignore[override]
        model = SummonerSpellImage
        fields = ['image_url']
