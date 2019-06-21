"""player/serializers.py
"""
from rest_framework import serializers

from data.serializers import DynamicSerializer
from .models import Summoner
from .models import RankPosition, Custom


class SummonerSerializer(DynamicSerializer):
    class Meta:
        model = Summoner
        fields = '__all__'

class RankPositionSerializer(DynamicSerializer):
    class Meta:
        model = RankPosition
        fields = '__all__'


class CustomSerializer(DynamicSerializer):
    class Meta:
        model = Custom
        fields = '__all__'
