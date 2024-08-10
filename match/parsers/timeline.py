from typing import Annotated, Literal, TypeAlias, Union
from pydantic import Field, field_validator
from core.parsers import BaseModelWithLogger
from lolsite.tasks import get_riot_api


class PositionModel(BaseModelWithLogger):
    x: int
    y: int


LaneType: TypeAlias = Literal["MID_LANE", "BOT_LANE", "TOP_LANE"]
TowerType: TypeAlias = Literal[
    "OUTER_TURRET", "INNER_TURRET", "BASE_TURRET", "NEXUS_TURRET"
]


class TimelineMetadataModel(BaseModelWithLogger):
    dataVersion: int
    matchId: str
    participants: list[str]


class PauseEndEventModel(BaseModelWithLogger):
    type: Literal["PAUSE_END"]
    realTimestamp: int
    timestamp: int


class PauseStartEventModel(BaseModelWithLogger):
    type: Literal["PAUSE_START"]
    realTimestamp: int
    timestamp: int


class ItemPurchasedEventModel(BaseModelWithLogger):
    type: Literal["ITEM_PURCHASED"]
    timestamp: int
    itemId: int
    participantId: int


class ItemDestroyedEventModel(ItemPurchasedEventModel):
    type: Literal["ITEM_DESTROYED"]


class ItemSoldEventModel(ItemPurchasedEventModel):
    type: Literal["ITEM_SOLD"]


class ItemUndoEventModel(BaseModelWithLogger):
    type: Literal["ITEM_UNDO"]
    afterId: int
    beforeId: int
    goldGain: int
    participantId: int
    timestamp: int


class SkillLevelUpEventModel(BaseModelWithLogger):
    type: Literal["SKILL_LEVEL_UP"]
    levelUpType: str
    participantId: int
    skillSlot: int
    timestamp: int


class LevelUpModel(BaseModelWithLogger):
    type: Literal["LEVEL_UP"]
    level: int
    participantId: int
    timestamp: int


class WardPlacedEventModel(BaseModelWithLogger):
    type: Literal["WARD_PLACED"]
    creatorId: int
    timestamp: int
    wardType: str


class WardKillEventModel(BaseModelWithLogger):
    type: Literal["WARD_KILL"]
    killerId: int
    timestamp: int
    wardType: str


class VictimDamageDealtModel(BaseModelWithLogger):
    basic: bool
    magicDamage: int
    name: str
    participantId: int
    physicalDamage: int
    spellName: str
    spellSlot: int
    trueDamage: int
    type: str


class VictimDamageReceivedModel(VictimDamageDealtModel):
    ...


class ChampionKillEventModel(BaseModelWithLogger):
    type: Literal["CHAMPION_KILL"]
    assistingParticipantIds: list[int] | None = None
    bounty: int
    killStreakLength: int
    killerId: int
    position: PositionModel
    shutdownBounty: int | None = 0
    timestamp: int
    victimDamageDealt: list[VictimDamageDealtModel] | None = None
    victimDamageReceived: list[VictimDamageReceivedModel] | None = None
    victimId: int

    @field_validator("victimDamageDealt", "victimDamageReceived", mode='before')
    @classmethod
    def victim_damage_defaults(cls, v):
        if not v:
            return []
        return v


class ChampionSpecialKillEventModel(BaseModelWithLogger):
    type: Literal["CHAMPION_SPECIAL_KILL"]
    assistingParticipantIds: list[int] | None = None
    killType: str
    killerId: int
    multiKillLength: int | None = None
    position: PositionModel
    timestamp: int


class TurretPlateDestroyedEventModel(BaseModelWithLogger):
    type: Literal["TURRET_PLATE_DESTROYED"]
    killerId: int
    laneType: Literal["BOT_LANE", "MID_LANE", "TOP_LANE"]
    position: PositionModel
    teamId: int
    timestamp: int


class EliteMonsterKillEventModel(BaseModelWithLogger):
    type: Literal["ELITE_MONSTER_KILL"]
    bounty: int | None = 0
    killerId: int
    killerTeamId: int
    monsterType: Literal["RIFTHERALD", "DRAGON", "BARON_NASHOR", "HORDE"]
    monsterSubType: Literal[
        "AIR_DRAGON",
        "CHEMTECH_DRAGON",
        "HEXTECH_DRAGON",
        "ELDER_DRAGON",
        "EARTH_DRAGON",
        "WATER_DRAGON",
        "FIRE_DRAGON",
    ] | None = None
    position: PositionModel
    timestamp: int
    assistingParticipantIds: list[int] | None = Field(default_factory=list)


class BuildingKillEventModel(BaseModelWithLogger):
    type: Literal["BUILDING_KILL"]
    assistingParticipantIds: list[int] = Field(default_factory=list)
    bounty: int | None = 0
    buildingType: Literal["TOWER_BUILDING", "INHIBITOR_BUILDING"]
    killerId: int
    laneType: LaneType
    position: PositionModel
    teamId: int
    timestamp: int
    towerType: TowerType | None = None


class ObjectiveBountyPrestartEventModel(BaseModelWithLogger):
    type: Literal["OBJECTIVE_BOUNTY_PRESTART"]
    actualStartTime: int
    teamId: int
    timestamp: int


class GameEndEventModel(BaseModelWithLogger):
    type: Literal["GAME_END"]
    gameId: int
    realTimestamp: int
    timestamp: int
    winningTeam: int


class ChampionTransformEventModel(BaseModelWithLogger):
    type: Literal["CHAMPION_TRANSFORM"]
    participantId: int
    timestamp: int
    transformType: Literal["SLAYER", "ASSASSIN"]


class ObjectiveBountyFinishEventModel(BaseModelWithLogger):
    type: Literal["OBJECTIVE_BOUNTY_FINISH"]
    teamId: int
    timestamp: int


class DragonSoulGivenEventModel(BaseModelWithLogger):
    type: Literal["DRAGON_SOUL_GIVEN"]
    name: str
    teamId: int
    timestamp: int


EventType = Annotated[
    Union[
        PauseEndEventModel,
        PauseStartEventModel,
        ItemPurchasedEventModel,
        ItemUndoEventModel,
        ItemSoldEventModel,
        SkillLevelUpEventModel,
        WardPlacedEventModel,
        WardKillEventModel,
        ChampionKillEventModel,
        ChampionSpecialKillEventModel,
        ItemDestroyedEventModel,
        LevelUpModel,
        TurretPlateDestroyedEventModel,
        EliteMonsterKillEventModel,
        BuildingKillEventModel,
        ObjectiveBountyPrestartEventModel,
        GameEndEventModel,
        ChampionTransformEventModel,
        ObjectiveBountyFinishEventModel,
        DragonSoulGivenEventModel,
    ],
    Field(discriminator="type"),
]


class ChampionStatModel(BaseModelWithLogger):
    abilityHaste: int | None = 0
    abilityPower: int
    armor: int
    armorPen: int
    armorPenPercent: int
    attackDamage: int
    attackSpeed: int
    bonusArmorPenPercent: int
    bonusMagicPenPercent: int
    ccReduction: int
    cooldownReduction: int
    health: int
    healthMax: int
    healthRegen: int
    lifesteal: int
    magicPen: int
    magicPenPercent: int
    magicResist: int
    movementSpeed: int
    omnivamp: int | None = 0
    physicalVamp: int | None = 0
    power: int
    powerMax: int
    powerRegen: int
    spellVamp: int


class DamageStatModel(BaseModelWithLogger):
    magicDamageDone: int
    magicDamageDoneToChampions: int
    magicDamageTaken: int
    physicalDamageDone: int
    physicalDamageDoneToChampions: int
    physicalDamageTaken: int
    totalDamageDone: int
    totalDamageDoneToChampions: int
    totalDamageTaken: int
    trueDamageDone: int
    trueDamageDoneToChampions: int
    trueDamageTaken: int


class ParticipantFrameModel(BaseModelWithLogger):
    championStats: ChampionStatModel
    currentGold: int
    damageStats: DamageStatModel
    goldPerSecond: int
    jungleMinionsKilled: int
    level: int
    minionsKilled: int
    participantId: int
    position: PositionModel
    timeEnemySpentControlled: int
    totalGold: int
    xp: int


class FrameModel(BaseModelWithLogger):
    events: list[EventType]
    participantFrames: dict[int, ParticipantFrameModel]
    timestamp: int


class TimelineParticipantModel(BaseModelWithLogger):
    participantId: int
    puuid: str


class TimelineInfoModel(BaseModelWithLogger):
    frameInterval: int
    frames: list[FrameModel]
    gameId: int
    participants: list[TimelineParticipantModel]
    endOfGameResult: str | None = None


class TimelineResponseModel(BaseModelWithLogger):
    metadata: TimelineMetadataModel
    info: TimelineInfoModel


def do_test(match_id="NA1_4739487600"):
    api = get_riot_api()
    r = api.match.timeline(match_id, "na")
    data = r.json()
    parsed = TimelineResponseModel(**data)
    print(parsed)
    return parsed
