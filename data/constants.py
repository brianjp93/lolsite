from typing import TypedDict
from enum import StrEnum
from pydantic import BaseModel
from datetime import datetime


MIN_PASSWORD_LENGTH = 7

TRUTHY = ["true", "True", "TRUE", True]
FALSEY = ["false", "False", "FALSE", False]


def is_truthy(val):
    return val is True or (isinstance(val, str) and val.lower() == "true")


def is_falsey(val):
    return val is False or (isinstance(val, str) and val.lower() == "false")


def get_null_bool(val):
    """coerce val to bool or None

    Parameters
    ----------
    val : str or bool

    Returns
    -------
    bool or None
    """
    out = None
    if is_truthy(val):
        out = True
    elif is_falsey(val):
        out = False
    return out


class Season(BaseModel):
    start: datetime
    end: datetime
    patch_start: tuple
    patch_end: tuple
    name: str


SEASONS = [
    Season(
        start=datetime(2020, 1, 23),
        end=datetime(2020, 11, 10),
        patch_start=(10, 1),
        patch_end=(10, 22),
        name="Season 10",
    ),
    # Season(
    #     start=timezone.datetime(2020, 1, 23),
    #     end=timezone.datetime(2020, 11, 10),
    #     patch_start=(10, 1),
    #     patch_end=(10, 22),
    #     name="Season 14 Split 2",
    # )
]

FLEX_QUEUE = 440
SOLO_QUEUE = 420
ARENA_QUEUE = 1700

QUEUES = [
    {
        "_id": 0,
        "_map": "Custom games",
        "description": "Custom games",
    },
    {
        "_id": 2,
        "_map": "Summoner's Rift",
        "description": "5v5 Blind Pick games",
    },
    {
        "_id": 33,
        "_map": "Summoner's Rift",
        "description": "Co-op vs. AI Intermediate Bot games",
    },
    {
        "_id": 72,
        "_map": "Howling Abyss",
        "description": "1v1 Snowdown Showdown games",
    },
    {
        "_id": 73,
        "_map": "Howling Abyss",
        "description": "2v2 Snowdown Showdown games",
    },
    {
        "_id": 75,
        "_map": "Summoner's Rift",
        "description": "6v6 Hexakill games",
    },
    {
        "_id": 76,
        "_map": "Summoner's Rift",
        "description": "Ultra Rapid Fire games",
    },
    {
        "_id": 78,
        "_map": "Howling Abyss",
        "description": "One For All: Mirror Mode games",
    },
    {
        "_id": 83,
        "_map": "Summoner's Rift",
        "description": "Co-op vs AI Ultra Rapid Fire games",
    },
    {
        "_id": 98,
        "_map": "Twisted Treeline",
        "description": "6v6 Hexakill games",
    },
    {
        "_id": 100,
        "_map": "Butcher's Bridge",
        "description": "5v5 ARAM games",
    },
    {
        "_id": 310,
        "_map": "Summoner's Rift",
        "description": "Nemesis games",
    },
    {
        "_id": 313,
        "_map": "Summoner's Rift",
        "description": "Black Market Brawlers games",
    },
    {
        "_id": 317,
        "_map": "Crystal Scar",
        "description": "Definitely Not Dominion games",
    },
    {
        "_id": 325,
        "_map": "Summoner's Rift",
        "description": "All Random games",
    },
    {
        "_id": 400,
        "_map": "Summoner's Rift",
        "description": "5v5 Draft Pick games",
    },
    {
        "_id": 420,
        "_map": "Summoner's Rift",
        "description": "5v5 Ranked Solo games",
    },
    {
        "_id": 430,
        "_map": "Summoner's Rift",
        "description": "5v5 Blind Pick games",
    },
    {
        "_id": 440,
        "_map": "Summoner's Rift",
        "description": "5v5 Ranked Flex games",
    },
    {
        "_id": 450,
        "_map": "Howling Abyss",
        "description": "5v5 ARAM games",
    },
    {"_id": 460, "_map": "Twisted Treeline", "description": "3v3 Blind Pick games"},
    {"_id": 470, "_map": "Twisted Treeline", "description": "3v3 Ranked Flex games"},
    {
        "_id": 480,
        "_map": "Summoner's Rift",
        "description": "5v5 Swift Play games",
    },
    {"_id": 490, "_map": "Summoner's Rift", "description": "Normal (Quickplay)"},
    {"_id": 600, "_map": "Summoner's Rift", "description": "Blood Hunt Assassin games"},
    {"_id": 610, "_map": "Cosmic Ruins", "description": "Dark Star: Singularity games"},
    {"_id": 700, "_map": "Summoner's Rift", "description": "Clash games"},
    {"_id": 720, "_map": "Summoner's Rift", "description": "ARAM Clash games"},
    {
        "_id": 800,
        "_map": "Twisted Treeline",
        "description": "Co-op vs. AI Intermediate Bot games",
    },
    {
        "_id": 810,
        "_map": "Twisted Treeline",
        "description": "Co-op vs. AI Intro Bot games",
    },
    {
        "_id": 820,
        "_map": "Twisted Treeline",
        "description": "Co-op vs. AI Beginner Bot games",
    },
    {
        "_id": 830,
        "_map": "Summoner's Rift",
        "description": "Co-op vs. AI Intro Bot games",
    },
    {
        "_id": 840,
        "_map": "Summoner's Rift",
        "description": "Co-op vs. AI Beginner Bot games",
    },
    {
        "_id": 850,
        "_map": "Summoner's Rift",
        "description": "Co-op vs. AI Intermediate Bot games",
    },
    {"_id": 900, "_map": "Summoner's Rift", "description": "ARURF games"},
    {"_id": 910, "_map": "Crystal Scar", "description": "Ascension games"},
    {
        "_id": 920,
        "_map": "Howling Abyss",
        "description": "Legend of the Poro King games",
    },
    {"_id": 940, "_map": "Summoner's Rift", "description": "Nexus Siege games"},
    {"_id": 950, "_map": "Summoner's Rift", "description": "Doom Bots Voting games"},
    {"_id": 960, "_map": "Summoner's Rift", "description": "Doom Bots Standard games"},
    {
        "_id": 980,
        "_map": "Valoran City Park",
        "description": "Star Guardian Invasion: Normal games",
    },
    {
        "_id": 990,
        "_map": "Valoran City Park",
        "description": "Star Guardian Invasion: Onslaught games",
    },
    {"_id": 1000, "_map": "Overcharge", "description": "PROJECT: Hunters games"},
    {"_id": 1010, "_map": "Summoner's Rift", "description": "Snow ARURF games"},
    {"_id": 1020, "_map": "Summoner's Rift", "description": "One for All games"},
    {
        "_id": 1030,
        "_map": "Crash Site",
        "description": "Odyssey Extraction: Intro games",
    },
    {
        "_id": 1040,
        "_map": "Crash Site",
        "description": "Odyssey Extraction: Cadet games",
    },
    {
        "_id": 1050,
        "_map": "Crash Site",
        "description": "Odyssey Extraction: Crewmember games",
    },
    {
        "_id": 1060,
        "_map": "Crash Site",
        "description": "Odyssey Extraction: Captain games",
    },
    {
        "_id": 1070,
        "_map": "Crash Site",
        "description": "Odyssey Extraction: Onslaught games",
    },
    {"_id": 1200, "_map": "Nexus Blitz", "description": "Nexus Blitz games"},
    {"_id": 1300, "_map": "Nexus Blitz", "description": "Nexus Blitz games"},
    {
        "_id": 1400,
        "_map": "Ultimate Spellbook",
        "description": "Ultimate Spellbook games",
    },
    {
        "_id": 1700,
        "_map": "Rings of Wrath",
        "description": "Arena",
    },
    {
        "_id": 1820,
        "_map": "Swarm Map",
        "description": "Swarm",
    },
    {
        "_id": 1900,
        "_map": "Summoner's Rift",
        "description": "U.R.F.",
    },
    {"_id": 2000, "_map": "Summoner's Rift", "description": "Tutorial Part 1"},
    {"_id": 2010, "_map": "Summoner's Rift", "description": "Tutorial Part 2"},
    {"_id": 2020, "_map": "Summoner's Rift", "description": "Tutorial Part 3"},
]
QUEUE_DICT = {x['_id']: x for x in QUEUES}
QUEUE_SELECT_OPTIONS = [QUEUE_DICT[x] for x in [
    420,
    400,
    450,
    1700,
    0,
]]

MAPS = [
    {
        "_id": 1,
        "name": "Summoner's Rift",
        "notes": "Original Summer variant",
    },
    {
        "_id": 2,
        "name": "Summoner's Rift",
        "notes": "Original Autumn variant",
    },
    {
        "_id": 3,
        "name": "The Proving Grounds",
        "notes": "Tutorial map",
    },
    {
        "_id": 4,
        "name": "Twisted Treeline",
        "notes": "Original version",
    },
    {
        "_id": 8,
        "name": "The Crystal Scar",
        "notes": "Dominion map",
    },
    {
        "_id": 10,
        "name": "Twisted Treeline",
        "notes": "Current version",
    },
    {
        "_id": 11,
        "name": "Summoner's Rift",
        "notes": "Current version",
    },
    {
        "_id": 12,
        "name": "Howling Abyss",
        "notes": "ARAM map",
    },
    {
        "_id": 14,
        "name": "Butcher's Bridge",
        "notes": "ARAM map",
    },
    {
        "_id": 16,
        "name": "Cosmic Ruins",
        "notes": "Dark Star: Singularity map",
    },
    {
        "_id": 18,
        "name": "Valoran City Park",
        "notes": "Star Guardian Invasion map",
    },
    {
        "_id": 19,
        "name": "Substructure 43",
        "notes": "PROJECT: Hunters map",
    },
    {
        "_id": 20,
        "name": "Crash Site",
        "notes": "Odyssey: Extraction map",
    },
    {
        "_id": 21,
        "name": "Nexus Blitz",
        "notes": "Nexus Blitz map",
    },
]

GAMEMODES = [
    {
        "name": "CLASSIC",
        "description": "Classic Summoner's Rift and Twisted Treeline games",
    },
    {
        "name": "ODIN",
        "description": "Dominion/Crystal Scar games",
    },
    {
        "name": "ARAM",
        "description": "ARAM games",
    },
    {
        "name": "TUTORIAL",
        "description": "Tutorial games",
    },
    {
        "name": "URF",
        "description": "URF games",
    },
    {
        "name": "DOOMBOTSTEEMO",
        "description": "Doom Bot games",
    },
    {
        "name": "ONEFORALL",
        "description": "One for All games",
    },
    {
        "name": "ASCENSION",
        "description": "Ascension games",
    },
    {
        "name": "FIRSTBLOOD",
        "description": "Snowdown Showdown games",
    },
    {
        "name": "KINGPORO",
        "description": "Legend of the Poro King games",
    },
    {
        "name": "SIEGE",
        "description": "Nexus Siege games",
    },
    {
        "name": "ASSASSINATE",
        "description": "Blood Hunt Assassin games",
    },
    {
        "name": "ARSR",
        "description": "All Random Summoner's Rift games",
    },
    {
        "name": "DARKSTAR",
        "description": "Dark Star: Singularity games",
    },
    {
        "name": "STARGUARDIAN",
        "description": "Star Guardian Invasion games",
    },
    {
        "name": "PROJECT",
        "description": "PROJECT: Hunters games",
    },
    {
        "name": "GAMEMODEX",
        "description": "Nexus Blitz games",
    },
    {
        "name": "ODYSSEY",
        "description": "Odyssey: Extraction games",
    },
]

GAMETYPES = [
    {
        "name": "CUSTOM_GAME",
        "description": "Custom games",
    },
    {
        "name": "TUTORIAL_GAME",
        "description": "Tutorial games",
    },
    {
        "name": "MATCHED_GAME",
        "description": "All other games",
    },
]

LANGUAGES = [
    "en_US",
    "cs_CZ",
    "de_DE",
    "el_GR",
    "en_AU",
    "en_GB",
    "en_PH",
    "en_SG",
    "es_AR",
    "es_ES",
    "es_MX",
    "fr_FR",
    "hu_HU",
    "id_ID",
    "it_IT",
    "ja_JP",
    "ko_KR",
    "pl_PL",
    "pt_BR",
    "ro_RO",
    "ru_RU",
    "th_TH",
    "tr_TR",
    "vn_VN",
    "zh_CN",
    "zh_MY",
    "zh_TW",
]


RANKS = {
    9: {
        "TIERS": [
            "unranked",
            "iron",
            "bronze",
            "silver",
            "gold",
            "platinum",
            "diamond",
            "master",
            "grandmaster",
            "challenger",
        ],
        "DIVISIONS": ["I", "II", "III", "IV"],
    },
    13.2: {
        "TIERS": [
            "unranked",
            "iron",
            "bronze",
            "silver",
            "gold",
            "platinum",
            "emerald",
            "diamond",
            "master",
            "grandmaster",
            "challenger",
        ],
        "DIVISIONS": ["I", "II", "III", "IV"],
    }
}


# SEASON TIMINGS
# https://leagueoflegends.fandom.com/wiki/Patch#Pre-Season%20Six
SEASON_PATCHES = {
    13: {
        "preseason": {
            "start": (12, 22),
            "end": (12, 100),
        },
        "season": {
            "start": (13, 1),
            "end": (13, 100),
        },
    },
    12: {
        "preseason": {
            "start": (11, 24),
            "end": (11, 100),
        },
        "season": {
            "start": (12, 1),
            "end": (12, 21),
        },
    },
    11: {
        "preseason": {
            "start": (10, 23),
            "end": (10, 25),
        },
        "season": {
            "start": (11, 1),
            "end": (11, 23),
        },
    },
    10: {
        "preseason": {
            "start": (9, 23),
            "end": (9, 24),
        },
        "season": {
            "start": (10, 1),
            "end": (10, 22),
        },
    },
    9: {
        "preseason": {
            "start": (8, 23),
            "end": (9, 1),
        },
        "season": {
            "start": (9, 2),
            "end": (9, 22),
        },
    },
    8: {
        "preseason": {
            "start": (7, 22),
            "end": (7, 24),
        },
        "season": {
            "start": (8, 1),
            "end": (8, 22),
        },
    },
    7: {
        "preseason": {
            "start": (6, 21),
            "end": (6, 24),
        },
        "season": {
            "start": (7, 1),
            "end": (7, 21),
        },
    },
    6: {
        "preseason": {
            "start": (5, 22),
            "end": (5, 24),
        },
        "season": {
            "start": (6, 1),
            "end": (6, 21),
        },
    },
    5: {
        "preseason": {
            "start": (4, 20),
            "end": (4, 21),
        },
        "season": {
            "start": (5, 1),
            "end": (5, 21),
        },
    },
    4: {
        "preseason": {
            "start": (3, 14),
            "end": (3, 15),
        },
        "season": {
            "start": (4, 1),
            "end": (4, 19),
        },
    },
    3: {
        "preseason": {
            "start": (1, 1),
            "end": (1, 1),
        },
        "season": {
            "start": (3, 1),
            "end": (3, 13),
        },
    },
}

class ItemStatCosts(TypedDict):
    flat_armor: float
    percent_crit: float
    flat_health: float
    percent_health_regen: float
    flat_ability_power: float
    flat_movement_speed: float
    flat_mana: float
    flat_attack_damage: float
    flat_magic_resist: float
    percent_attack_speed: float
    percent_movement_speed: float
    percent_life_steal: float
    flat_lethality: float
    flat_ability_haste: float
    percent_heal_and_shield_power: float
    percent_omnivamp: float
    percent_armor_penetration: float
    percent_base_mana_regen: float
    percent_tenacity: float
    percent_magic_penetration: float
    percent_crit_damage: float
    flat_magic_penetration: float

# gold per stat
ITEM_STAT_COSTS: ItemStatCosts = {
    'flat_armor': 300 / 15,
    'percent_crit': 600 / 15,
    'flat_health': 400 / 150,
    'percent_health_regen': 300 / 100,
    'flat_ability_power': 400 / 20,
    'flat_movement_speed': 300 / 25,
    'flat_mana': 300 / 300,
    'flat_attack_damage': 350 / 10,
    'flat_magic_resist': 400 / 20,
    'percent_attack_speed': 300 / 12,
    'percent_movement_speed': 284 / 5,  # calculated from aether wisp
    'percent_life_steal': 375 / 7,  # calculated from vampiric scepter
    'flat_lethality': 1000 / 30,
    'flat_ability_haste': 250 / 5,
    'percent_heal_and_shield_power': 550 / 8,
    'percent_base_mana_regen': 200 / 50,
    'percent_omnivamp': 220.57 / 5,
    'percent_armor_penetration': 41.6666667,  # value from https://leagueoflegends.fandom.com/wiki/Armor_penetration
    'percent_tenacity': 15,  # completely arbitrary (don't know how this should be calculated)
    'percent_crit_damage': 4.5,  # calculated from IE as 100% efficient
    'percent_magic_penetration': 46.15,  # value from https://leagueoflegends.fandom.com/wiki/Magic_penetration
    'flat_magic_penetration': 31.11,
}

class Region(StrEnum):
    NA = 'na'
    EUW = 'euw'
    EUNE = 'eune'
    KR = 'kr'
    JP = 'jp'
    LAN = 'lan'
    LAS = 'las'
    BR = 'br'
    OCE  = 'oce'
    TR = 'tr'
    RU = 'ru'


class Structure(BaseModel):
    key: str
    name: str
    x: int
    y: int

STRUCTURES = [
    # blue team
    Structure(key='bt1_top', name='Tier 1 Top', x=981, y=10441),
    Structure(key='bt2_top', name='Tier 2 Top', x=1512, y=6699),
    Structure(key='bt3_top', name='Tier 3 Top', x=1169, y=4287),

    Structure(key='bt1_mid', name='Tier 1 Mid', x=5846, y=6396),
    Structure(key='bt2_mid', name='Tier 2 Mid', x=5048, y=4812),
    Structure(key='bt3_mid', name='Tier 3 Mid', x=3651, y=3696),

    Structure(key='bt1_bot', name='Tier 1 Bot', x=10504, y=1029),
    Structure(key='bt2_bot', name='Tier 2 Bot', x=6919, y=1483),
    Structure(key='bt3_bot', name='Tier 3 Bot', x=4281, y=1253),

    Structure(key='bi_top', name='Top Inhibitor', x=1169, y=3573),
    Structure(key='bi_mid', name='Mid Inhibitor', x=3203, y=3208),
    Structure(key='bi_bot', name='Bot Inhibitor', x=3454, y=1241),

    Structure(key='bn1', name='Nexus Turret 1', x=1748, y=2270),
    Structure(key='bn2', name='Nexus Turret 2', x=2177, y=1807),

    # red team
    Structure(key='rt1_top', name='Tier 1 Top', x=4318, y=13875),
    Structure(key='rt2_top', name='Tier 2 Top', x=7943, y=13411),
    Structure(key='rt3_top', name='Tier 3 Top', x=10481, y=13650),

    Structure(key='rt1_mid', name='Tier 1 Mid', x=8955, y=8510),
    Structure(key='rt2_mid', name='Tier 2 Mid', x=9767, y=10113),
    Structure(key='rt3_mid', name='Tier 3 Mid', x=8955, y=8510),

    Structure(key='rt1_bot', name='Tier 1 Bot', x=13866, y=4505),
    Structure(key='rt2_bot', name='Tier 2 Bot', x=13327, y=8226),
    Structure(key='rt3_bot', name='Tier 3 Bot', x=13624, y=10572),

    Structure(key='ri_top', name='Top Inhibitor', x=11261, y=13659),
    Structure(key='ri_mid', name='Mid Inhibitor', x=11603, y=11667),
    Structure(key='ri_bot', name='Bot Inhibitor', x=13598, y=11316),

    Structure(key='rn1', name='Nexus Turret 1', x=12611, y=13084),
    Structure(key='rn2', name='Nexus Turret 2', x=13052, y=12612),
]

STRUCTURES_DICT = [x.model_dump() for x in STRUCTURES]
