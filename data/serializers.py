from rest_framework import serializers
from .models import ProfileIcon, Item, ItemGold, ItemStat
from .models import ReforgedRune

class ProfileIconSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = ProfileIcon
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):

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