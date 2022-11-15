from lol.riot import Riot as RiotAPI
from django.conf import settings


def get_riot_api():
    return RiotAPI(settings.RIOT_API_TOKEN)
