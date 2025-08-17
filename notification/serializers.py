"""notification/serializers.py
"""
from rest_framework import serializers
from player.serializers import CommentSerializer
from data.serializers import DynamicSerializer
from notification.models import Notification


class NotificationSerializer(DynamicSerializer):
    get_match_id = serializers.IntegerField()
    external_id = serializers.CharField()
    comment = CommentSerializer()

    class Meta:  # type: ignore[override]
        model = Notification
        fields = '__all__'
