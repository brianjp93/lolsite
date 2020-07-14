"""notification/serializers.py
"""
from rest_framework import serializers
from data.serializers import DynamicSerializer
from notification.models import Notification


class NotificationSerializer(DynamicSerializer):
    get_match_id = serializers.IntegerField()

    class Meta:
        model = Notification
        fields = '__all__'
