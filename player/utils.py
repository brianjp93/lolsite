"""player/utils.py
"""
from django.contrib.auth.models import User
from player.models import Summoner

from player.tasks import import_summoner


def get_admin():
    user: User | None = User.objects.filter(is_superuser=True).first()
    return user


def handle_multiple_summoners(name: str, region: str):
    for summoner in Summoner.objects.filter(region=region, simple_name=name):
        import_summoner(region, name=summoner.simple_name)
    return Summoner.objects.get(region=region, simple_name=name)
