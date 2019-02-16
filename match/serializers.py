from rest_framework import serializers
from .models import Match, Participant, Stats
from .models import Timeline, Team, Ban


class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'


class StatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        fields = '__all__'


class TimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeline
        fields = '__all__'


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


class BanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ban
        fields = '__all__'


class FullParticipantSerializer(serializers.ModelSerializer):
    stats = StatsSerializer(read_only=True)
    timelines = TimelineSerializer(many=True, read_only=True)

    class Meta:
        model = Participant
        fields = '__all__'


class FullTeamSerializer(serializers.ModelSerializer):
    bans = BanSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = '__all__'


class FullMatchSerializer(serializers.ModelSerializer):
    participants = FullParticipantSerializer(many=True, read_only=True)
    teams = FullTeamSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = '__all__'
