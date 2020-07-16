"""notification/serializers.py
"""
from rest_framework import serializers
from player.serializers import CommentSerializer
from data.serializers import DynamicSerializer
from notification.models import Notification


class NotificationSerializer(DynamicSerializer):
    get_match_id = serializers.IntegerField()
    comment = CommentSerializer()

    class Meta:
        model = Notification
        fields = '__all__'
