from rest_framework import serializers

from .models import Summoner
from .models import RankPosition


class SummonerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Summoner
        fields = '__all__'

class RankPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RankPosition
        fields = '__all__'