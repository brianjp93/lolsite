"""player/serializers.py
"""
from rest_framework import serializers

from data.serializers import DynamicSerializer
from .models import Summoner
from .models import RankPosition, Custom
from .models import Favorite, Comment


class SummonerSerializer(DynamicSerializer):
    class Meta:
        model = Summoner
        fields = "__all__"


class RankPositionSerializer(DynamicSerializer):
    class Meta:
        model = RankPosition
        fields = "__all__"


class CustomSerializer(DynamicSerializer):
    class Meta:
        model = Custom
        fields = "__all__"


class FavoriteSerializer(DynamicSerializer):
    name = serializers.CharField()
    region = serializers.CharField()

    class Meta:
        model = Favorite
        fields = "__all__"


class CommentSerializer(DynamicSerializer):
    summoner = SummonerSerializer()

    class Meta:
        model = Comment
        fields = [
            "created_date",
            "dislikes",
            "id",
            "likes",
            "markdown",
            "match",
            "modified_date",
            "reply_to",
            "summoner",
        ]
