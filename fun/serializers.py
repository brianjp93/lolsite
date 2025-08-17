from rest_framework import serializers

from .models import InspirationalMessage


class InspirationalMessageSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore[override]
        model = InspirationalMessage
        fields = "__all__"
