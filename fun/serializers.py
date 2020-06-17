from rest_framework import serializers

from .models import InspirationalMessage


class InspirationalMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspirationalMessage
        fields = "__all__"
