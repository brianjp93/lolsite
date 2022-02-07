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
    summoner = serializers.PrimaryKeyRelatedField(
        queryset=Summoner.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = Reputation
        fields = [
            'id',
            'summoner',
            'is_approve',
        ]

    def validate(self, attrs):
        attrs['user'] = self.context['request'].user
        user = attrs['user']
        self.validate_user(user)
        summoner = attrs['summoner']
        if not self.user_has_match_overlap(user, summoner):
            raise serializers.ValidationError(
                {'summoner': ['This summoner has no overlap with the user\'s linked accounts.']}
            )
        return super().validate(attrs)

    def validate_user(self, user):
        if self.context['request'].user == user:
            return user
        raise serializers.ValidationError('User must match the user making the request.')

    @staticmethod
    def user_has_match_overlap(user: User, summoner: Summoner):
        """Check if a User's linked Summoner accounts have any overlap with the given summoner.

        - Users should only be able to rate a player's Reputation if they have played a game together.

        """
        user_summoners = Summoner.objects.filter(
            summonerlinks__user=user,
        ).values_list('puuid')
        user_summoners = [x[0] for x in user_summoners]

        # The summoner we are checking cannot belong to the user.
        if summoner.puuid in user_summoners:
            return False

        if not user_summoners:
            raise serializers.ValidationError({'user': ['This user has no linked summoner accounts.']})
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
