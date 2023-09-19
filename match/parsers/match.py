import time
import logging
from typing import Literal
from typing_extensions import Annotated
from pydantic import field_validator, Field, model_validator
from pydantic.functional_validators import BeforeValidator
from core.parsers import BaseModelWithLogger
from lolsite.tasks import get_riot_api

from player.models import simplify

logger = logging.getLogger(__name__)


class StylesModel(BaseModelWithLogger):
    description: str
    selections: list[dict[Literal['perk', 'var1', 'var2', 'var3'], int]]
    style: int


class SelectionModel(BaseModelWithLogger):
    perk: int
    var1: int
    var2: int
    var3: int


class PrimaryPerkStyleModel(BaseModelWithLogger):
    description: Literal['primaryStyle']
    style: int
    selections: list[SelectionModel]

    @field_validator('selections')
    @classmethod
    def validate_selections(cls, v):
        if len(v) != 4:
            raise ValueError(f'selections should have length 4 but had length {len(v)}')
        return v


class SubPerkStyleModel(BaseModelWithLogger):
    description: Literal['subStyle']
    style: int
    selections: list[SelectionModel]

    @field_validator('selections')
    @classmethod
    def validate_selections(cls, v):
        if len(v) != 2:
            raise ValueError(f'selections should have length 2 but had length {len(v)}')
        return v


class PerksModel(BaseModelWithLogger):
    statPerks: dict[Literal['defense', 'flex', 'offense'], int]
    styles: list[StylesModel]

    @property
    def primary_style(self):
        out = [x for x in self.styles if x.description == 'primaryStyle'][0]
        return PrimaryPerkStyleModel(**out.model_dump())

    @property
    def sub_style(self):
        out = [x for x in self.styles if x.description == 'subStyle'][0]
        return SubPerkStyleModel(**out.model_dump())


def ping_validator(v: int|None):
    if not v:
        return 0
    return v


Ping = Annotated[int, BeforeValidator(ping_validator)]


class ParticipantModel(BaseModelWithLogger):
    challenges: dict[str, float | int] = Field(default_factory=dict)
    perks: PerksModel
    assists: int
    baronKills: int
    bountyLevel: int
    champExperience: int
    champLevel: int
    championId: int
    championName: str
    championTransform: int
    consumablesPurchased: int
    damageDealtToBuildings: int
    damageDealtToObjectives: int
    damageDealtToTurrets: int
    damageSelfMitigated: int
    deaths: int
    detectorWardsPlaced: int
    doubleKills: int
    dragonKills: int
    eligibleForProgression: bool | None = None
    allInPings: Ping = 0
    assistMePings: Ping = 0
    baitPings: Ping = 0
    basicPings: Ping = 0
    commandPings: Ping = 0
    dangerPings: Ping = 0
    enemyMissingPings: Ping = 0
    enemyVisionPings: Ping = 0
    getBackPings: Ping = 0
    holdPings: Ping = 0
    needVisionPings: Ping = 0
    onMyWayPings: Ping = 0
    pushPings: Ping = 0
    visionClearedPings: Ping = 0
    firstBloodAssist: bool
    firstBloodKill: bool
    firstTowerAssist: bool
    firstTowerKill: bool
    gameEndedInEarlySurrender: bool
    gameEndedInSurrender: bool
    goldEarned: int
    goldSpent: int
    individualPosition: str
    inhibitorKills: int
    inhibitorTakedowns: int | None
    inhibitorsLost: int
    item0: int
    item1: int
    item2: int
    item3: int
    item4: int
    item5: int
    item6: int
    itemsPurchased: int
    killingSprees: int
    kills: int
    lane: str
    largestCriticalStrike: int
    largestKillingSpree: int
    largestMultiKill: int
    longestTimeSpentLiving: int
    magicDamageDealt: int
    magicDamageDealtToChampions: int
    magicDamageTaken: int
    neutralMinionsKilled: int
    nexusKills: int
    nexusLost: int
    nexusTakedowns: int | None
    objectivesStolen: int
    objectivesStolenAssists: int
    participantId: int
    pentaKills: int
    placement: int = 0
    subTeamPlacement: int = 0
    physicalDamageDealt: int
    physicalDamageDealtToChampions: int
    physicalDamageTaken: int
    profileIcon: int
    puuid: str
    quadraKills: int
    riotIdName: str
    riotIdTagline: str
    role: str
    sightWardsBoughtInGame: int
    spell1Casts: int = 0
    spell2Casts: int = 0
    spell3Casts: int = 0
    spell4Casts: int = 0
    summoner1Casts: int
    summoner1Id: int
    summoner2Casts: int
    summoner2Id: int
    summonerId: str
    summonerLevel: int
    summonerName: str
    teamEarlySurrendered: bool
    teamId: int
    teamPosition: str
    timeCCingOthers: int
    timePlayed: int
    totalDamageDealt: int
    totalDamageDealtToChampions: int
    totalDamageShieldedOnTeammates: int
    totalDamageTaken: int
    totalHeal: int
    totalHealsOnTeammates: int
    totalMinionsKilled: int
    totalTimeCCDealt: int
    totalTimeSpentDead: int
    totalUnitsHealed: int
    totalAllyJungleMinionsKilled: int = 0
    totalEnemyJungleMinionsKilled: int = 0
    tripleKills: int
    trueDamageDealt: int
    trueDamageDealtToChampions: int
    trueDamageTaken: int
    turretKills: int = 0
    turretTakedowns: int | None
    turretsLost: int
    unrealKills: int
    visionScore: int
    visionWardsBoughtInGame: int
    wardsKilled: int = 0
    wardsPlaced: int = 0
    win: bool
    playerAugment1: int = 0
    playerAugment2: int = 0
    playerAugment3: int = 0
    playerAugment4: int = 0
    playerSubteamId: int = 0
    subteamPlacement: int = 0

    @property
    def simple_name(self):
        return simplify(self.summonerName)

    @property
    def stat_perk_0(self):
        return self.perks.statPerks.get('offense', 0)

    @property
    def stat_perk_1(self):
        return self.perks.statPerks.get('flex', 0)

    @property
    def stat_perk_2(self):
        return self.perks.statPerks.get('defense', 0)


class BanType(BaseModelWithLogger):
    championId: int
    pickTurn: int


class TeamObjectiveModel(BaseModelWithLogger):
    first: bool
    kills: int


class TeamObjectives(BaseModelWithLogger):
    baron: TeamObjectiveModel
    champion: TeamObjectiveModel
    dragon: TeamObjectiveModel
    inhibitor: TeamObjectiveModel
    riftHerald: TeamObjectiveModel
    tower: TeamObjectiveModel


class TeamModel(BaseModelWithLogger):
    bans: list[BanType]
    objectives: TeamObjectives
    teamId: int
    win: bool = False


class MatchMetaDataModel(BaseModelWithLogger):
    dataVersion: int
    matchId: str
    participants: list[str]


class MatchModel(BaseModelWithLogger):
    participants: list[ParticipantModel]
    teams: list[TeamModel]
    gameCreation: int
    gameEndTimestamp: int | None
    gameDuration: int
    gameId: int
    gameMode: str
    gameName: str
    gameStartTimestamp: int
    gameType: str
    gameVersion: str
    mapId: int
    platformId: str
    queueId: int
    tournamentCode: str | None

    @model_validator(mode='before')
    def game_duration_is_sometimes_not_right(cls, data):
        if data['gameEndTimestamp']:
            data['gameDuration'] *= 1000
        return data

    @property
    def sem_ver(self):
        version = {i: int(x) for i, x in enumerate(self.gameVersion.split("."))}
        return version


class MatchResponseModel(BaseModelWithLogger):
    metadata: MatchMetaDataModel
    info: MatchModel


def do_test():
    api = get_riot_api()
    response = api.match.get('NA1_4495779664', 'na')
    start = time.perf_counter()
    MatchResponseModel.model_validate_json(response.content)
    print(f'Parse Time: {time.perf_counter() - start}')
