from django.db.models import QuerySet
from rest_framework import serializers
from .models import ProfileIcon, Item, ItemGold, ItemStat
from .models import ReforgedRune, Champion, ChampionSpell
from .models import ItemMap, ChampionStats, ChampionSpellVar


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


class ItemSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()
    thumbs = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if isinstance(self.instance, QuerySet):
            self.instance = self.instance.select_related('image')

    def get_thumbs(self, instance):
        return instance.image.thumbs()


class ItemGoldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemGold
        fields = "__all__"


class ItemMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemMap
        fields = ["key", "value"]


class ItemStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemStat
        fields = "__all__"


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


class ChampionSerializer(DynamicSerializer):
    image_url = serializers.CharField()
    thumbs = serializers.SerializerMethodField()
    stats = ChampionStatsSerializer()
    spells = ChampionSpellSerializer(many=True)

    class Meta:
        model = Champion
        fields = "__all__"

    def __init__(self, instance=None, **kwargs):
        if isinstance(instance, QuerySet):
            instance = instance.select_related('image', 'stats')
            instance = instance.prefetch_related(
                'spells', 'spells__vars', 'spells__image',
                'spells__effect_burn',
            )
        super().__init__(instance=instance, **kwargs)

    def get_thumbs(self, instance):
        return instance.image.thumbs()
