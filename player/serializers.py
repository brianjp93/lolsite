from rest_framework import serializers

from .models import Summoner
from .models import RankPosition, Custom


class SummonerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Summoner
        fields = '__all__'

class RankPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RankPosition
        fields = '__all__'


class CustomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Custom
        fields = '__all__'