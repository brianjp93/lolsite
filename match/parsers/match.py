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


class MissionsModel(BaseModelWithLogger):
    PlayerScore0: float|None = 0
    PlayerScore1: float|None = 0
    PlayerScore2: float|None = 0
    PlayerScore3: float|None = 0
    PlayerScore4: float|None = 0
    PlayerScore5: float|None = 0
    PlayerScore6: float|None = 0
    PlayerScore7: float|None = 0
    PlayerScore8: float|None = 0
    PlayerScore9: float|None = 0
    PlayerScore10: float|None = 0
    PlayerScore11: float|None = 0

    playerScore0: float|None = 0
    playerScore1: float|None = 0
    playerScore2: float|None = 0
    playerScore3: float|None = 0
    playerScore4: float|None = 0
    playerScore5: float|None = 0
    playerScore6: float|None = 0
    playerScore7: float|None = 0
    playerScore8: float|None = 0
    playerScore9: float|None = 0
    playerScore10: float|None = 0
    playerScore11: float|None = 0


class ParticipantModel(BaseModelWithLogger):
    challenges: dict[str, float | int | list[float | int]] = Field(default_factory=dict)
    perks: PerksModel
    assists: int
    baronKills: int
    bountyLevel: int | None = None
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
    damageDealtToEpicMonsters: int | None = 0
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
    retreatPings: Ping = 0
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
    riotIdGameName: str | None = ""
    riotIdTagline: str | None = ""
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
    playerAugment5: int = 0
    playerAugment6: int = 0
    playerSubteamId: int = 0
    subteamPlacement: int = 0
    PlayerScore0: float|None = 0
    PlayerScore1: float|None = 0
    PlayerScore2: float|None = 0
    PlayerScore3: float|None = 0
    PlayerScore4: float|None = 0
    PlayerScore5: float|None = 0
    PlayerScore6: float|None = 0
    PlayerScore7: float|None = 0
    PlayerScore8: float|None = 0
    PlayerScore9: float|None = 0
    PlayerScore10: float|None = 0
    PlayerScore11: float|None = 0
    missions: MissionsModel|None = None
    championSkinId: int | None = None

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


class Horde(BaseModelWithLogger):
    first: bool
    kills: int


class TeamObjectives(BaseModelWithLogger):
    baron: TeamObjectiveModel
    champion: TeamObjectiveModel
    dragon: TeamObjectiveModel
    inhibitor: TeamObjectiveModel
    riftHerald: TeamObjectiveModel
    tower: TeamObjectiveModel
    atakhan: TeamObjectiveModel | None = None
    horde: Horde | None = None


class FeatModel(BaseModelWithLogger):
    featState: int


class FeatsObjectModel(BaseModelWithLogger):
    EPIC_MONSTER_KILL: FeatModel
    FIRST_BLOOD: FeatModel
    FIRST_TURRET: FeatModel


class TeamModel(BaseModelWithLogger):
    bans: list[BanType]
    objectives: TeamObjectives
    teamId: int
    win: bool = False
    feats: FeatsObjectModel | None = None


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
    endOfGameResult: Literal['GameComplete', 'Abort_Unexpected', 'Abort_AntiCheatExit', 'Abort_TooFewPlayers'] | None = None

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
