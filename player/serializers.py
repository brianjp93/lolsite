"""player/serializers.py
"""
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from data.serializers import DynamicSerializer
from .models import Summoner, Reputation
from .models import RankPosition, Custom
from .models import Favorite, Comment

from match.models import Match, Participant

User = get_user_model()


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


class ReputationSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=True,
    )
    summoner_id = serializers.PrimaryKeyRelatedField(
        queryset=Summoner.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = Reputation
        fields = [
            'user_id',
            'summoner_id',
            'is_approve',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        user = attrs['user_id']
        summoner = attrs['summoner_id']
        if not self.user_has_match_overlap(user, summoner):
            raise serializers.ValidationError({'summoner_id': ['This summoner has no overlap with the user\'s linked accounts.']})
        return attrs

    @staticmethod
    def user_has_match_overlap(user: User, summoner: Summoner):
        """Check if a User's linked Summoner accounts have any overlap with the given summoner.

        - Users should only be able to rate a player's Reputation if they have played a game together.

        """
        user_summoners = Summoner.objects.filter(
            summonerlinks__user=user,
        ).values_list('puuid')
        user_summoners = [x[0] for x in user_summoners]
        if not user_summoners:
            raise serializers.ValidationError({'user_id': ['This user has no linked summoner accounts.']})
        q = Q()
        for puuid in user_summoners:
            q |= Q(puuid=summoner.puuid, match__participants__puuid=puuid)
        return Participant.objects.filter(q).exists()


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
            "is_deleted",
        ]
