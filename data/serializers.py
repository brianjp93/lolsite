from rest_framework import serializers
from .models import ProfileIcon, Item, ItemGold, ItemStat
from .models import ReforgedRune, Champion

class DynamicSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
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
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = Item
        fields = '__all__'


class ItemGoldSerializer(serializers.ModelSerializer):

    class Meta:
        model = ItemGold
        fields = '__all__'


class ItemStatSerializer(serializers.ModelSerializer):

    class Meta:
        model = ItemStat
        fields = '__all__'


class ReforgedRuneSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = ReforgedRune
        fields = '__all__'


class ChampionSerializer(DynamicSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = Champion
        fields = '__all__'
