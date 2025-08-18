from django.contrib.auth.models import AnonymousUser, User
from django.db.models import Q, F
from rest_framework import serializers

from data.models import CDProfileIcon
from data.serializers import DynamicSerializer
from lolsite.helpers import HtmxHttpRequest, UserType
from .models import Summoner, Reputation
from .models import RankPosition, Custom
from .models import Favorite, Comment, NameChange

from match.models import Participant


class ReputationSerializer(serializers.ModelSerializer):
    summoner = serializers.PrimaryKeyRelatedField(
        queryset=Summoner.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:  # type: ignore[override]
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
    def user_has_match_overlap(user: UserType | AnonymousUser, summoner: Summoner):
        """Check if a User's linked Summoner accounts have any overlap with the given summoner.

        - Users should only be able to rate a player's Reputation if they have played a game together.

        """
        if isinstance(user, AnonymousUser):
            return 0
        user_summoners = list(
            user.summonerlinks.filter(verified=True).annotate(
                puuid=F("summoner__puuid"),
            ).values_list("puuid", flat=True)
        )

        # The summoner we are checking cannot belong to the user.
        if summoner.puuid in user_summoners:
            return 0

        if not user_summoners:
            return 0
        q = Q()
        for puuid in user_summoners:
            q |= Q(puuid=summoner.puuid, match__participants__puuid=puuid)
        return Participant.objects.filter(q).count()


class SummonerSerializer(DynamicSerializer):
    has_match_overlap = serializers.SerializerMethodField()
    profile_icon = serializers.SerializerMethodField()

    class Meta:  # type: ignore[override]
        model = Summoner
        fields = (
            'id',
            'has_match_overlap',
            "profile_icon",
            "region",
            "name",
            "simple_name",
            "profile_icon_id",
            "puuid",
            "summoner_level",
            "riot_id_name",
            "riot_id_tagline",
        )

    def get_has_match_overlap(self, obj):
        request: HtmxHttpRequest | None = self.context.get('request')
        if request:
            try:
                return ReputationSerializer.user_has_match_overlap(request.user, obj)
            except serializers.ValidationError:
                pass
        return 0

    def get_profile_icon(self, obj):
        if icon := CDProfileIcon.objects.filter(ext_id=obj.profile_icon_id).first():
            return icon.image_url()
        return ''


class RankPositionSerializer(DynamicSerializer):
    class Meta:  # type: ignore[override]
        model = RankPosition
        fields = "__all__"


class CustomSerializer(DynamicSerializer):
    class Meta:  # type: ignore[override]
        model = Custom
        fields = "__all__"


class FavoriteSerializer(DynamicSerializer):
    name = serializers.CharField()
    region = serializers.CharField()
    puuid = serializers.CharField(source="summoner.puuid")
    riot_id_name = serializers.CharField(source="summoner.riot_id_name")
    riot_id_tagline = serializers.CharField(source="summoner.riot_id_tagline")

    class Meta:  # type: ignore[override]
        model = Favorite
        fields = (
            'name',
            'region',
            'puuid',
            'sort_int',
            'summoner_id',
            'riot_id_name',
            'riot_id_tagline',
        )

class UserSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = User
        fields = [
            'email',
        ]


class CommentSerializer(DynamicSerializer):
    summoner = SummonerSerializer()
    markdown = serializers.SerializerMethodField()

    class Meta:  # type: ignore[override]
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

    def get_markdown(self, obj):
        if obj.is_deleted:
            return ""
        return obj.markdown


class CommentCreateSerializer(serializers.ModelSerializer):
    summoner = serializers.SlugRelatedField('puuid', queryset=Summoner.objects.all())

    class Meta:  # type: ignore[override]
        model = Comment
        fields = [
            'markdown',
            'match',
            'reply_to',
            'summoner',
        ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        request = self.context['request']
        self.fields['summoner'].queryset = Summoner.objects.filter(  # type: ignore
            id__in=request.user.summonerlinks.all().values_list('summoner_id', flat=True)
        )

    def validate_summoner(self, obj: Summoner):
        if 'request' not in self.context:
            return obj
        request = self.context['request']
        user: User = request.user
        if not user.is_authenticated:
            raise serializers.ValidationError('No connected summoners.', code='summoner_not_connected')
        if user.summonerlinks.filter(summoner=obj).first():  # type: ignore
            return obj
        raise serializers.ValidationError('The selected summoner is not connected to this account.', code='summoner_not_connected')


class CommentUpdateSerializer(serializers.ModelSerializer):
    markdown = serializers.CharField(write_only=True)

    class Meta:  # type: ignore[override]
        model = Comment
        fields = [
            'markdown',
        ]

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        assert isinstance(self.instance, Comment)
        if self.instance.is_deleted:  # type: ignore
            raise serializers.ValidationError('Comment is deleted, cannot update.', code='comment_already_deleted')
        if not user.is_authenticated:
            raise serializers.ValidationError('Comment not owned by user.', code='invalid_comment_update')
        if not user.summonerlinks.filter(summoner=self.instance.summoner).exists():
            raise serializers.ValidationError('Comment not owned by user.', code='invalid_comment_update')
        return super().validate(attrs)


class NameChangeSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = NameChange
        fields = (
            'old_name',
            'created_date',
        )
