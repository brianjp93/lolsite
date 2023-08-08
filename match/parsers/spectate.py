from typing import Any
from core.parsers import BaseModelWithLogger
from lolsite.tasks import get_riot_api


class SpectateObserver(BaseModelWithLogger):
    encryptionKey: str


class SpectatePerk(BaseModelWithLogger):
    perkIds: list[int]
    perkStyle: int
    perkSubStyle: int


class SpectateBan(BaseModelWithLogger):
    championId: int
    teamId: int
    pickTurn: int


class SpectateParticipant(BaseModelWithLogger):
    teamId: int
    spell1Id: int
    spell2Id: int
    championId: int
    profileIconId: int
    summonerName: str
    bot: bool
    summonerId: str
    gameCustomizationObjects: list[Any]
    perks: SpectatePerk


class SpectateModel(BaseModelWithLogger):
    gameId: int
    mapId: int
    gameMode: str
    gameType: str
    gameQueueConfigId: int
    gameStartTime: int
    gameLength: int
    platformId: str
    observers: SpectateObserver
    participants: list[SpectateParticipant]
    bannedChampions: list[SpectateBan]


def do_test():
    pass
    # todo
    # api = get_riot_api()
    # r = api.spectator.get()
    # data = r.json()
