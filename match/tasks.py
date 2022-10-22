"""match/tasks.py
"""
from django.db.utils import IntegrityError
from django.db.models import Count, Subquery, OuterRef
from django.db.models import Case, When, Sum
from django.db.models import IntegerField, Q, F
from django.db import connection
from django.utils import timezone

from .models import Match, Participant, Stats
from .models import Team, Ban

from .models import AdvancedTimeline, Frame, ParticipantFrame
from .models import WardKillEvent, WardPlacedEvent
from .models import LevelUpEvent, SkillLevelUpEvent
from .models import ItemPurchasedEvent, ItemDestroyedEvent, ItemSoldEvent
from .models import ItemUndoEvent, TurretPlateDestroyedEvent
from .models import EliteMonsterKillEvent, ChampionSpecialKillEvent
from .models import BuildingKillEvent, GameEndEvent
from .models import ChampionKillEvent
from .models import VictimDamageDealt, VictimDamageReceived

from .models import Spectate

from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger

from player.models import Summoner, simplify, NameChange
from player import tasks as pt

from lolsite.celery import app
import logging
from multiprocessing.dummy import Pool as ThreadPool
import time

from functools import partial
from typing import Optional


ROLES = ["top", "jg", "mid", "adc", "sup"]
logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    pass


# @query_debugger
def import_match(match_id, region, refresh=False, close=False):
    """Import a match by its ID.

    Parameters
    ----------
    match_id : ID
    region : str
    refresh : bool
        Whether or not to re-import the match if it already exists.

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        r = api.match.get(match_id, region=region)
        match = r.json()

        if r.status_code == 429:
            return "throttled"
        if r.status_code == 404:
            return "not found"

        import_match_from_data(match, refresh=refresh, region=region)
    if close:
        connection.close()


def import_summoner_from_participant(participants, region):
    """Import a summoner using participant data.

    Parameters
    ----------
    participants : dict[]
    region : str

    Returns
    -------
    None

    """
    sums = []
    for part in participants:
        if part["summoner_id"]:
            puuid = part["puuid"]
            name = part["summoner_name"]
            _id = part["summoner_id"]
            summoner = Summoner(
                _id=_id,
                name=name,
                simple_name=simplify(name),
                region=region.lower(),
                puuid=puuid,
            )
            sums.append(summoner)
    Summoner.objects.bulk_create(sums, ignore_conflicts=True)


@app.task(name="match.tasks.handle_name_changes")
def handle_name_changes():
    """Create NameChange objects from Participant Data."""
    qs = Participant.objects.all().annotate(
        current_name=Subquery(
            Summoner.objects.filter(puuid=OuterRef('puuid')).values('name')[:1]
        )
    ).exclude(current_name=F('summoner_name'))
    for participant in qs:
        summoner = Summoner.objects.filter(puuid=participant.puuid).values('id').first()
        if summoner:
            NameChange.objects.get_or_create(summoner_id=summoner['id'], old_name=participant.summoner_name)


def import_match_from_data(data, refresh=False, region=""):
    """Import a match given the riot data response json.

    Ignore tutorial games.

    Parameters
    ----------
    data : dict
        Riot JSON data
    refresh : bool
    region : str

    Returns
    -------
    None, or False if failed.

    """
    game_mode = data["info"]["gameMode"]
    if "tutorial" in game_mode.lower():
        return False

    parsed = parse_match(data)

    match_data = parsed.pop("match")
    match_model = Match(**match_data)
    try:
        match_model.save()
    except IntegrityError:
        if refresh:
            Match.objects.get(_id=match_data["_id"]).delete()
            match_model.save()
        else:
            logging.exception("Attempting to import game which was already imported.")
            return

    participants_data = parsed.pop("participants")
    try:
        import_summoner_from_participant(participants_data, region)
    except IntegrityError as error:
        match_model.delete()
        raise error

    for _p_data in participants_data:
        stats_data = _p_data.pop("stats")

        _p_data["match"] = match_model

        # PARTICIPANT
        participant_model = Participant(**_p_data)
        try:
            participant_model.save()
        except Exception as error:
            match_model.delete()
            raise error

        # STATS
        stats_data["participant"] = participant_model
        stats_model = Stats(**stats_data)
        try:
            stats_model.save()
        except IntegrityError as error:
            match_model.delete()
            raise error

    # TEAMS
    teams = parsed.pop("teams")
    for _t_data in teams:
        _t_data["match"] = match_model
        _bans = _t_data.pop("bans")

        team_model = Team(**_t_data)
        try:
            team_model.save()
        except Exception as error:
            raise error

        # BANS
        bans = []
        for _ban_data in _bans:
            _ban_data["team"] = team_model
            bans.append(Ban(**_ban_data))
        try:
            Ban.objects.bulk_create(bans)
        except Exception as error:
            raise error

    # set is_fully_imported after finished
    match_model.is_fully_imported = True
    match_model.save()


def parse_match(data):
    """Parse match data to be saved into models.

    Parameters
    ----------
    data : dict
        JSON match data from Riot API

    Returns
    -------
    dict
        formatted data to be saved into match models

    """
    metadata = data["metadata"]
    match_id = metadata["matchId"]
    data = data["info"]
    out = {
        "match": {},
        "participants": [],
        "teams": [],
    }
    try:
        version = {i: int(x) for i, x in enumerate(data["gameVersion"].split("."))}
    except Exception as error:
        logger.error("Error on parse.")
        logger.error(data)
        raise error
    game_duration = data["gameDuration"]
    if data.get("gameEndTimestamp") is not None:
        game_duration = game_duration * 1000
    match = {
        "_id": match_id,
        "game_creation": data["gameCreation"],
        "game_duration": game_duration,
        "game_mode": data["gameMode"],
        "game_type": data["gameType"],
        "map_id": data["mapId"],
        "game_version": data["gameVersion"],
        "major": version.get(0, ""),
        "minor": version.get(1, ""),
        "patch": version.get(2, ""),
        "build": version.get(3, ""),
        "platform_id": data["platformId"],
        "queue_id": data["queueId"],
    }
    out["match"] = match

    participants = []
    for part in data["participants"]:
        perks = {x["description"]: x for x in part["perks"]["styles"]}
        stat_perks = part["perks"]["statPerks"]
        stats = {
            "assists": part["assists"],
            "champ_level": part["champLevel"],
            "damage_dealt_to_objectives": part["damageDealtToObjectives"],
            "damage_dealt_to_turrets": part["damageDealtToTurrets"],
            "damage_self_mitigated": part["damageSelfMitigated"],
            "deaths": part["deaths"],
            "double_kills": part["doubleKills"],
            "first_blood_assist": part.get("firstBloodAssist", False),
            "first_blood_kill": part.get("firstBloodKill", False),
            "first_inhibitor_assist": part.get("firstInhibitorAssist", False),
            "first_inhibitor_kill": part.get("firstInhibitorKill", False),
            "first_tower_assist": part.get("firstTowerAssist", False),
            "first_tower_kill": part.get("firstTowerKill", False),
            "gold_earned": part["goldEarned"],
            "gold_spent": part["goldSpent"],
            "inhibitor_kills": part.get("inhibitorKills", 0),
            "item_0": part["item0"],
            "item_1": part["item1"],
            "item_2": part["item2"],
            "item_3": part["item3"],
            "item_4": part["item4"],
            "item_5": part["item5"],
            "item_6": part["item6"],
            "killing_sprees": part["killingSprees"],
            "kills": part["kills"],
            "largest_critical_strike": part["largestCriticalStrike"],
            "largest_killing_spree": part["largestKillingSpree"],
            "largest_multi_kill": part["largestMultiKill"],
            "longest_time_spent_living": part["longestTimeSpentLiving"],
            "magic_damage_dealt": part["magicDamageDealt"],
            "magic_damage_dealt_to_champions": part["magicDamageDealtToChampions"],
            "magical_damage_taken": part["magicDamageTaken"],
            "neutral_minions_killed": part["neutralMinionsKilled"],
            "neutral_minions_killed_enemy_jungle": part.get(
                "neutralMinionsKilledEnemyJungle", 0
            ),
            "neutral_minions_killed_team_jungle": part.get(
                "neutralMinionsKilledTeamJungle", 0
            ),
            "penta_kills": part["pentaKills"],
            "physical_damage_dealt": part["physicalDamageDealt"],
            "physical_damage_dealt_to_champions": part[
                "physicalDamageDealtToChampions"
            ],
            "physical_damage_taken": part["physicalDamageTaken"],
            "quadra_kills": part["quadraKills"],
            "sight_wards_bought_in_game": part["sightWardsBoughtInGame"],
            "stat_perk_0": stat_perks.get("offense", 0),
            "stat_perk_1": stat_perks.get("flex", 0),
            "stat_perk_2": stat_perks.get("defense", 0),
            "spell_1_casts": part.get("spell1Casts", 0),
            "spell_2_casts": part.get("spell2Casts", 0),
            "spell_3_casts": part.get("spell3Casts", 0),
            "spell_4_casts": part.get("spell4Casts", 0),
            "time_ccing_others": part["timeCCingOthers"],
            "total_damage_dealt": part["totalDamageDealt"],
            "total_damage_dealt_to_champions": part["totalDamageDealtToChampions"],
            "total_damage_taken": part["totalDamageTaken"],
            "total_damage_shielded_on_teammates": part[
                "totalDamageShieldedOnTeammates"
            ],
            "total_heal": part["totalHeal"],
            "total_heals_on_teammates": part["totalHealsOnTeammates"],
            "total_minions_killed": part["totalMinionsKilled"],
            "total_time_crowd_control_dealt": part["totalTimeCCDealt"],
            "total_units_healed": part["totalUnitsHealed"],
            "triple_kills": part["tripleKills"],
            "true_damage_dealt": part["trueDamageDealt"],
            "true_damage_dealt_to_champions": part["trueDamageDealtToChampions"],
            "true_damage_taken": part["trueDamageTaken"],
            "turret_kills": part.get("turretKills", 0),
            "unreal_kills": part["unrealKills"],
            "vision_score": part["visionScore"],
            "vision_wards_bought_in_game": part["visionWardsBoughtInGame"],
            "wards_killed": part.get("wardsKilled", 0),
            "wards_placed": part.get("wardsPlaced", 0),
            "detector_wards_placed": part.get("detectorWardsPlaced", 0),
            "win": part["win"],
        }
        all_perks = (
            perks["primaryStyle"]["selections"] + perks["subStyle"]["selections"]
        )
        for i, perk in enumerate(all_perks):
            stats[f"perk_{i}"] = perk.get("perk", 0)
            stats[f"perk_{i}_var_1"] = perk.get("var1", 0)
            stats[f"perk_{i}_var_2"] = perk.get("var2", 0)
            stats[f"perk_{i}_var_3"] = perk.get("var3", 0)
        stats["perk_primary_style"] = perks["primaryStyle"]["style"]
        stats["perk_sub_style"] = perks["subStyle"]["style"]

        participant = {
            "_id": part["participantId"],
            "summoner_id": part.get("summonerId", None),
            "puuid": part.get("puuid", None),
            "summoner_name": part["summonerName"],
            "champion_id": part["championId"],
            "champ_experience": part["champExperience"],
            "summoner_1_id": part["summoner1Id"],
            "summoner_1_casts": part["summoner1Casts"],
            "summoner_2_id": part["summoner2Id"],
            "summoner_2_casts": part["summoner2Casts"],
            "team_id": part["teamId"],
            "lane": part.get("lane", ""),
            "role": part.get("role", ""),
            "individual_position": part["individualPosition"],
            "team_position": part["teamPosition"],
            "stats": dict(stats),
        }
        participants.append(dict(participant))

    out["participants"] = participants

    teams = []

    for _team in data["teams"]:

        bans = []
        for _ban in _team["bans"]:
            bans.append(
                {
                    "champion_id": _ban["championId"],
                    "pick_turn": _ban["pickTurn"],
                }
            )

        objectives = _team["objectives"]
        team = {
            "_id": _team["teamId"],
            "baron_kills": objectives["baron"]["kills"],
            "first_baron": objectives["baron"]["first"],
            "dragon_kills": objectives["dragon"]["kills"],
            "first_blood": objectives["champion"]["first"],
            "first_dragon": objectives["dragon"]["first"],
            "first_inhibitor": objectives["inhibitor"]["first"],
            "first_rift_herald": objectives["riftHerald"]["first"],
            "first_tower": objectives["tower"]["first"],
            "inhibitor_kills": objectives["inhibitor"]["kills"],
            "rift_herald_kills": objectives["riftHerald"]["kills"],
            "tower_kills": objectives["tower"]["kills"],
            "win": _team.get("win", False),
            "bans": list(bans),
        }
        teams.append(dict(team))
    out["teams"] = teams
    return out


def full_import(name=None, puuid=None, region=None, **kwargs):
    """Import only unimported games for a summoner.

    Looks at summoner.full_import_count to determine how many
    matches need to be imported.

    Parameters
    ----------
    name : str
    region : str
    season_id : ID
    puuid : ID
    queue : int
    beginTime : Epoch in ms
    endTime : Epoch in ms

    Returns
    -------
    None

    """
    if region is None:
        raise Exception("region parameter is required.")
    if name is not None:
        summoner_id = pt.import_summoner(region, name=name)
        summoner = Summoner.objects.get(id=summoner_id, region=region)
        puuid = summoner.puuid
    elif puuid is not None:
        summoner = Summoner.objects.get(puuid=puuid, region=region)
    else:
        raise Exception("name or puuid must be provided.")

    old_import_count = summoner.full_import_count
    # TODO: implement get_total_matches
    # total = get_total_matches(puuid, region, **kwargs)
    total = 100

    new_import_count = total - old_import_count
    if new_import_count > 0:
        logger.info(f"Importing {new_import_count} matches for {summoner.name}.")
        is_finished = import_recent_matches(0, new_import_count, puuid, region)
        if is_finished:
            summoner.full_import_count = total
            summoner.save()


def ranked_import(name=None, puuid=None, region=None, **kwargs):
    """Same as full_import except it only pulls from the 3 ranked queues.

    Parameters
    ----------
    name : str
    puuid : ID
    region : str
    season_id : ID
    puuid : ID
        the encrypted account ID
    queue : int
    beginTime : Epoch in ms
    endTime : Epoch in ms

    Returns
    -------
    None

    """
    kwargs["queue"] = [420, 440, 470]

    if region is None:
        raise Exception("region parameter is required.")
    if name is not None:
        summoner_id = pt.import_summoner(region, name=name)
        summoner = Summoner.objects.get(id=summoner_id, region=region)
        puuid = summoner.puuid
    elif puuid is not None:
        summoner = Summoner.objects.get(puuid=puuid, region=region)
    else:
        raise Exception("name or puuid must be provided.")

    old_import_count = summoner.ranked_import_count
    # TODO
    # total = get_total_matches(account_id, region, **kwargs)
    total = 100

    new_import_count = total - old_import_count
    if new_import_count > 0:
        logger.info(f"Importing {new_import_count} ranked matches for {summoner.name}.")
        is_finished = import_recent_matches(
            0, new_import_count, puuid, region, **kwargs
        )
        if is_finished:
            summoner.ranked_import_count = total
            summoner.save()


@app.task(name="match.tasks.import_recent_matches")
def import_recent_matches(
    start: int,
    end: int,
    puuid: str,
    region: str,
    queue: Optional[int] = None,
    startTime: Optional[int] = None,
    endTime: Optional[int] = None,
):
    """Import recent matches for a puuid.

    Parameters
    ----------
    start : int
    end : int
    season_id : ID
    puuid : ID
        the encrypted account ID
    queue : int
    startTime : Epoch in ms
    endTime : Epoch in ms

    Returns
    -------
    int

    """
    has_more = True
    api = get_riot_api()
    pool = ThreadPool(10)
    import_count = 0
    if api:
        index = start
        size = 100
        if index + size > end:
            size = end - start
        please_continue = True
        while has_more and please_continue:
            riot_match_request_time = time.time()

            apicall = partial(
                api.match.filter,
                puuid,
                region=region,
                start=index,
                count=size,
                startTime=startTime,
                endTime=endTime,
                queue=queue,
            )
            r = apicall()
            riot_match_request_time = time.time() - riot_match_request_time
            logger.info(
                f"Riot API match filter request time : {riot_match_request_time}"
            )
            try:
                if r.status_code == 404:
                    matches = []
                else:
                    matches = r.json()
            except Exception:
                time.sleep(10)
                r = apicall()
                if r.status_code == 404:
                    matches = []
                else:
                    matches = r.json()
            if len(matches) > 0:
                existing_ids = [x._id for x in Match.objects.filter(_id__in=matches)]
                new_matches = list(set(matches) - set(existing_ids))
                import_count += len(new_matches)
                pool.map(lambda x: import_match(x, region, close=True), new_matches)
            else:
                has_more = False
            index += size
            if index >= end:
                please_continue = False
    return import_count


def get_top_played_with(
    summoner_id,
    team=True,
    season_id=None,
    queue_id=None,
    recent=None,
    recent_days=None,
    group_by="summoner_name",
):
    """Find the summoner names that you have played with the most.

    Parameters
    ----------
    summoner_id : int
        The *internal* Summoner ID
    team : bool
        Only count players who were on the same team
    season_id : int
    queue_id : int
    recent : int
        count of most recent games to check
    recent_days : int

    Returns
    -------
    query of counts

    """
    summoner = Summoner.objects.get(id=summoner_id)

    p = Participant.objects.all()
    if season_id is not None:
        p = p.filter(match__season_id=season_id)
    if queue_id is not None:
        p = p.filter(match__queue_id=queue_id)

    if recent is not None:
        m = Match.objects.all()
        if season_id is not None:
            m = m.filter(season_id=season_id)
        if queue_id is not None:
            m = m.filter(queue_id=queue_id)
        m = m.order_by("-game_creation")
        m_id_list = [x.id for x in m[:recent]]

        p = p.filter(match__id__in=m_id_list)
    elif recent_days is not None:
        now = timezone.now()
        start_time = now - timezone.timedelta(days=recent_days)
        start_time = int(start_time.timestamp() * 1000)
        p = p.filter(match__game_creation__gt=start_time)

    # get all participants that were in a match with the given summoner
    p = p.filter(match__participants__puuid=summoner.puuid)

    # exclude the summoner
    p = p.exclude(puuid=summoner.puuid)

    # I could include and `if team` condition, but I am assuming the top
    # values will be the same as the totals
    if not team:
        p = p.exclude(
            team_id=Subquery(
                Participant.objects.filter(
                    match__participants__id=OuterRef("id"),
                    puuid=summoner.puuid,
                ).values("team_id")[:1]
            )
        )
    else:
        p = p.filter(
            team_id=Subquery(
                Participant.objects.filter(
                    match__participants__id=OuterRef("id"),
                    puuid=summoner.puuid,
                ).values("team_id")[:1]
            )
        )
    p = p.annotate(
        win=Case(When(stats__win=True, then=1), default=0, output_field=IntegerField())
    )

    p = p.values(group_by).annotate(count=Count(group_by), wins=Sum("win"))
    p = p.order_by("-count")

    return p


def get_frame_event_types():
    return {
        "WARD_KILL": {
            "model": WardKillEvent,
            "events": [],
            "mapping": {
                "killer_id": ["killerId", None],
                "ward_type": ["wardType", None],
            },
        },
        "WARD_PLACED": {
            "model": WardPlacedEvent,
            "events": [],
            "mapping": {
                "creator_id": ["creatorId", None],
                "ward_type": ["wardType", None],
            },
        },
        "LEVEL_UP": {
            "model": LevelUpEvent,
            "events": [],
            "mapping": {
                "level": ["level", None],
                "participant_id": ["participantId", None],
            },
        },
        "SKILL_LEVEL_UP": {
            "model": SkillLevelUpEvent,
            "events": [],
            "mapping": {
                "level_up_type": ["levelUpType", None],
                "participant_id": ["participantId", None],
                "skill_slot": ["skillSlot", None],
            },
        },
        "ITEM_PURCHASED": {
            "model": ItemPurchasedEvent,
            "events": [],
            "mapping": {
                "item_id": ["itemId", None],
                "participant_id": ["participantId", None],
            },
        },
        "ITEM_DESTROYED": {
            "model": ItemDestroyedEvent,
            "events": [],
            "mapping": {
                "item_id": ["itemId", None],
                "participant_id": ["participantId", None],
            },
        },
        "ITEM_SOLD": {
            "model": ItemSoldEvent,
            "events": [],
            "mapping": {
                "item_id": ["itemId", None],
                "participant_id": ["participantId", None],
            },
        },
        "ITEM_UNDO": {
            "model": ItemUndoEvent,
            "events": [],
            "mapping": {
                "participant_id": ["participantId", None],
                "before_id": ["beforeId", None],
                "after_id": ["afterId", None],
                "gold_gain": ["goldGain", None],
            },
        },
        "TURRET_PLATE_DESTROYED": {
            "model": TurretPlateDestroyedEvent,
            "events": [],
            "mapping": {
                "killer_id": ["killerId", None],
                "lane_type": ["laneType", None],
                "x": ["position__x", None],
                "y": ["position__y", None],
                "team_id": ["teamId", None],
            },
        },
        "ELITE_MONSTER_KILL": {
            "model": EliteMonsterKillEvent,
            "events": [],
            "mapping": {
                "killer_id": ["killerId", None],
                "bounty": ["bounty", 0],
                "assisting_participant_ids": ["assistingParticipantIds", None],
                "killer_team_id": ["killerTeamId", None],
                "monster_type": ["monsterType", None],
                "monster_sub_type": ["monsterSubType", None],
                "x": ["position__x", None],
                "y": ["position__y", None],
            },
        },
        "CHAMPION_SPECIAL_KILL": {
            "model": ChampionSpecialKillEvent,
            "events": [],
            "mapping": {
                "assisting_participant_ids": ["assistingParticipantIds", None],
                "kill_type": ["killType", None],
                "killer_id": ["killerId", None],
                "multi_kill_length": ["multiKillLength", None],
                "x": ["position__x", None],
                "y": ["position__y", None],
            },
        },
        "BUILDING_KILL": {
            "model": BuildingKillEvent,
            "events": [],
            "mapping": {
                "assisting_participant_ids": ["assistingParticipantIds", None],
                "building_type": ["buildingType", None],
                "killer_id": ["killerId", None],
                "lane_type": ["laneType", None],
                "team_id": ["teamId", None],
                "tower_type": ["towerType", None],
                "x": ["position__x", None],
                "y": ["position__y", None],
                "bounty": ["bounty", 0],
            },
        },
        "GAME_END": {
            "model": GameEndEvent,
            "events": [],
            "mapping": {
                "game_id": ["gameId", None],
                "real_timestamp": ["realTimestamp", None],
                "winning_team": ["winningTeam", None],
            },
        },
        "CHAMPION_KILL": {
            "model": ChampionKillEvent,
            "events": [],
            "mapping": {
                "bounty": ["bounty", 0],
                "shutdown_bounty": ["shutdownBounty", 0],
                "kill_streak_length": ["killStreakLength", None],
                "killer_id": ["killerId", None],
                "victim_id": ["victimId", None],
                "x": ["position__x", None],
                "y": ["position__y", None],
            },
        },
    }


@app.task(name="match.tasks.import_advanced_timeline")
def import_advanced_timeline(match_id=None, overwrite=False):
    """

    Parameters
    ----------
    match_id : ID
        Internal Match ID

    Returns
    -------
    None

    """
    match = Match.objects.get(id=match_id)
    try:
        match.advancedtimeline
        if overwrite:
            match.advancedtimeline.delete()
    except:
        # we haven't imported it yet.
        pass
    api = get_riot_api()
    if api:
        region = match.platform_id.lower()
        logger.info(f"Requesting info for match {match.id} in region {region}")
        r = api.match.timeline(match._id, region=region)
        data = r.json()
        _data = data
        data = data["info"]
        frame_interval = data["frameInterval"]
        at = AdvancedTimeline(match=match, frame_interval=frame_interval)
        at.save()

        for _frame in data["frames"]:
            timestamp = _frame["timestamp"]
            frame = Frame(timeline=at, timestamp=timestamp)
            frame.save()
            pframes = []
            for i, p_frame in _frame["participantFrames"].items():

                pos = p_frame.get("position", {})
                stats = p_frame.get("championStats", {})
                dmg_stats = p_frame.get("damageStats", {})
                p_frame_data = {
                    "frame": frame,
                    "participant_id": p_frame["participantId"],
                    "current_gold": p_frame["currentGold"],
                    "jungle_minions_killed": p_frame["jungleMinionsKilled"],
                    "gold_per_second": p_frame["goldPerSecond"],
                    "level": p_frame["level"],
                    "minions_killed": p_frame["minionsKilled"],
                    "time_enemy_spent_controlled": p_frame["timeEnemySpentControlled"],
                    "team_score": p_frame.get("teamScore", 0),
                    "total_gold": p_frame.get("totalGold", 0),
                    "xp": p_frame.get("xp", 0),
                    "x": pos.get("x"),
                    "y": pos.get("y"),
                    "ability_haste": stats.get("abilityHaste"),
                    "ability_power": stats.get("abilityPower"),
                    "armor": stats.get("armor"),
                    "armor_pen": stats.get("armorPen"),
                    "armor_pen_percent": stats.get("armorPenPercent"),
                    "attack_damage": stats.get("attackDamage"),
                    "attack_speed": stats.get("attackSpeed"),
                    "bonus_armor_pen_percent": stats.get("bonusArmorPenPercent"),
                    "bonus_magic_pen_percent": stats.get("bonusMagicPenPercent"),
                    "cc_reduction": stats.get("ccReduction"),
                    "cooldown_reduction": stats.get("cooldownReduction"),
                    "health": stats.get("health"),
                    "health_max": stats.get("healthMax"),
                    "health_regen": stats.get("healthRegen"),
                    "lifesteal": stats.get("lifesteal"),
                    "magic_pen": stats.get("magicPen"),
                    "magic_pen_percent": stats.get("magicPenPercent"),
                    "magic_resist": stats.get("magicResist"),
                    "movement_speed": stats.get("movementSpeed"),
                    "omnivamp": stats.get("omnivamp"),
                    "physical_vamp": stats.get("physicalVamp"),
                    "power": stats.get("power"),
                    "power_max": stats.get("powerMax"),
                    "power_regen": stats.get("powerRegen"),
                    "spell_vamp": stats.get("spellVamp"),
                    "magic_damage_done": dmg_stats.get("magicDamageDone"),
                    "magic_damage_done_to_champions": dmg_stats.get(
                        "magicDamageDoneToChampions"
                    ),
                    "magic_damage_taken": dmg_stats.get("magicDamageTaken"),
                    "physical_damage_done": dmg_stats.get("physicalDamageDone"),
                    "physical_damage_done_to_champions": dmg_stats.get(
                        "physicalDamageDoneToChampions"
                    ),
                    "physical_damage_taken": dmg_stats.get("physicalDamageTaken"),
                    "total_damage_done": dmg_stats.get("totalDamageDone"),
                    "total_damage_done_to_champions": dmg_stats.get(
                        "totalDamageDoneToChampions"
                    ),
                    "total_damage_taken": dmg_stats.get("totalDamageTaken"),
                    "true_damage_done": dmg_stats.get("trueDamageDone"),
                    "true_damage_done_to_champions": dmg_stats.get(
                        "trueDamageDoneToChampions"
                    ),
                    "true_damage_taken": dmg_stats.get("trueDamageTaken"),
                }
                pframes.append(ParticipantFrame(**p_frame_data))

            ParticipantFrame.objects.bulk_create(pframes)

            victim_damage_received_events = []
            victim_damage_dealt_events = []
            events = get_frame_event_types()
            for _event in _frame["events"]:
                participant_id = _event.get("participantId", None)
                if participant_id is None:
                    participant_id = _event.get("creatorId", None)
                pos = _event.get("position", {})
                event_type = _event["type"]

                for temp_event_type, val in events.items():
                    if temp_event_type == event_type:
                        kwargs = {}
                        for _key, (_val, _default) in val["mapping"].items():
                            _data = _event
                            for lookup in _val.split("__"):
                                _data = _data.get(lookup, {})
                                if _data == {}:
                                    _data = _default
                            kwargs[_key] = _data
                        created_model = val["model"](
                            frame=frame,
                            timestamp=_event["timestamp"],
                            **kwargs,
                        )
                        val["events"].append(created_model)
                        if temp_event_type == "CHAMPION_KILL":
                            for item in _event.get("victimDamageDealt", []):
                                kwargs = {
                                    "championkillevent": created_model,
                                    "basic": item["basic"],
                                    "magic_damage": item["magicDamage"],
                                    "name": item["name"],
                                    "participant_id": item["participantId"],
                                    "physical_damage": item["physicalDamage"],
                                    "spell_name": item["spellName"],
                                    "spell_slot": item["spellSlot"],
                                    "true_damage": item["trueDamage"],
                                    "type": item["type"],
                                }
                                victim_damage_dealt_events.append(
                                    VictimDamageDealt(**kwargs),
                                )
                            for item in _event.get("victimDamageReceived", []):
                                kwargs = {
                                    "championkillevent": created_model,
                                    "basic": item["basic"],
                                    "magic_damage": item["magicDamage"],
                                    "name": item["name"],
                                    "participant_id": item["participantId"],
                                    "physical_damage": item["physicalDamage"],
                                    "spell_name": item["spellName"],
                                    "spell_slot": item["spellSlot"],
                                    "true_damage": item["trueDamage"],
                                    "type": item["type"],
                                }
                                victim_damage_received_events.append(
                                    VictimDamageReceived(**kwargs),
                                )

            for val in events.values():
                model = val["model"]
                model.objects.bulk_create(val["events"])
            VictimDamageDealt.objects.bulk_create(victim_damage_dealt_events)
            VictimDamageReceived.objects.bulk_create(victim_damage_received_events)


def import_spectate_from_data(data, region):
    """Import Spectate model from JSON data.

    Parameters
    ----------
    data : dict
    region : str

    Returns
    -------
    None

    """
    spectate_data = {
        "game_id": data["gameId"],
        "region": region,
        "platform_id": data["platformId"],
        "encryption_key": data["observers"]["encryptionKey"],
    }
    spectate = Spectate(**spectate_data)
    try:
        spectate.save()
    except IntegrityError:
        # already saved
        pass


def import_summoners_from_spectate(data, region):
    """

    Returns
    -------
    dict
        A mapping from the encrypted summoner ID to the internal ID
        {summoner._id: summoner.id}

    """
    summoners = {}
    for part in data["participants"]:
        summoner_id = part["summonerId"]
        if summoner_id:
            sum_data = {
                "name": part["summonerName"],
                "region": region,
                "profile_icon_id": part["profileIconId"],
                "_id": part["summonerId"],
            }
            summoner = Summoner(**sum_data)
            try:
                summoner.save()
                summoners[summoner._id] = summoner.id
            except IntegrityError:
                query = Summoner.objects.filter(region=region, _id=summoner_id)
                if summoner := query.first():
                    summoners[summoner._id] = summoner.id
    return summoners


def get_player_ranks(summoner_list, threshold_days=1):
    """ """
    with ThreadPool(10) as pool:
        pool.map(
            lambda x: pt.import_positions(x, threshold_days=threshold_days),
            summoner_list,
        )


def apply_player_ranks(match, threshold_days=1):
    """ """
    if not isinstance(match, Match):
        match = Match.objects.get(id=match)

    now = timezone.now()
    one_day_ago = now - timezone.timedelta(days=1)
    if match.get_creation() > one_day_ago:
        # ok -- apply ranks
        parts = match.participants.all()
        q = Q()
        for part in parts:
            q |= Q(_id=part.summoner_id, puuid=part.puuid)
        summoner_qs = Summoner.objects.filter(q)
        summoner_list = [x for x in summoner_qs]
        summoners = {x.puuid: x for x in summoner_qs}
        get_player_ranks(summoner_list, threshold_days=threshold_days)

        for part in parts:
            if not part.tier:
                # only applying if it is not already applied
                summoner = summoners.get(part.puuid)
                if summoner:
                    checkpoint = summoner.get_newest_rank_checkpoint()
                    if checkpoint:
                        query = checkpoint.positions.filter(
                            queue_type="RANKED_SOLO_5x5"
                        )
                        if query:
                            position = query[0]
                            part.rank, part.tier = position.rank, position.tier
                            part.save()
            else:
                # if any tiers are already applied, stop
                return


PARTICIPANT_ROLE_KEYS = {
    "TOP": 0,
    "JUNGLE": 5,
    "MIDDLE": 10,
    "BOTTOM": 15,
    "UTILITY": 20,
}


def participant_key(participant: Participant):
    """Use riot's `team_position` variable and order from top to sup."""
    return (
        participant.team_id,
        PARTICIPANT_ROLE_KEYS.get(participant.team_position, 25),
    )


def get_sorted_participants(match, participants=None):
    if not participants:
        participants = match.participants.all().select_related("stats")
    if len(participants) == 10:
        ordered = sorted(list(participants), key=participant_key)
    else:
        ordered = list(participants)
    return ordered
