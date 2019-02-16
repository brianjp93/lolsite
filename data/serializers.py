from rest_framework import serializers
from .models import ProfileIcon

class ProfileIconSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField()

    class Meta:
        model = ProfileIcon
        fields = '__all__'
