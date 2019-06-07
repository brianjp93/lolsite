import requests

import sys
import os

PACKAGE_PARENT = '..'
SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, PACKAGE_PARENT)))

from lol import resource


class RiotBase:

    base_url = {
        'br': 'https://br1.api.riotgames.com',
        'eune': 'https://eun1.api.riotgames.com',
        'euw': 'https://euw1.api.riotgames.com',
        'jp': 'https://jp1.api.riotgames.com', 
        'kr': 'https://kr.api.riotgames.com',
        'lan': 'https://la1.api.riotgames.com',
        'las': 'https://la2.api.riotgames.com',
        'na': 'https://na1.api.riotgames.com',
        'oce': 'https://oc1.api.riotgames.com',
        'tr': 'https://tr1.api.riotgames.com',
        'ru': 'https://ru.api.riotgames.com',
        'pbe': 'https://pbe1.api.riotgames.com',
    }

    def __init__(self, key):
        self.key = key
        self.headers = self.get_headers()

    def get_headers(self):
        headers = {
            "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Riot-Token": self.key,
            "Accept-Language": "en-US,en;q=0.8",
        }
        return headers


class Riot:
    """
    using V4 endpoints whenever possible
    """

    def __init__(self, key):
        self.key = key
        self.base = RiotBase(key)

        self.champion = resource.Champion(self.base)
        self.championmastery = resource.ChampionMastery(self.base)
        self.league = resource.League(self.base)
        self.lolstaticdata = resource.LolStaticData(self.base)
        self.lolstatus = resource.LolStatus(self.base)
        self.masteries = resource.Masteries(self.base)
        self.match = resource.Match(self.base)
        self.runes = resource.Runes(self.base)
        self.spectator = resource.Spectator(self.base)
        self.summoner = resource.Summoner(self.base)
        self.thirdpartycode = resource.ThirdPartyCode(self.base)
