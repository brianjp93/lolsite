import logging
import time
import json
from datetime import timedelta, datetime
from multiprocessing.pool import ThreadPool
from functools import partial
from typing import Optional, assert_never
from urllib3.exceptions import MaxRetryError
from requests.exceptions import ConnectionError

from pydantic import ValidationError

from django.db.utils import IntegrityError
from django.db.models import Exists, OuterRef
from django.utils import timezone
from django.db import connections, transaction, connection

from data.constants import ARENA_QUEUE, SOLO_QUEUE

from match.parsers.spectate import SpectateModel
from match.serializers import LlmMatchSerializer

from .parsers.match import BanType, MatchResponseModel, ParticipantModel, TeamModel
from .parsers.timeline import TimelineResponseModel
from .parsers import timeline as tmparsers

from .models import Match, MatchSummary, Participant, Stats
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

from player.models import RankPosition, Summoner
from player import tasks as pt

from lolsite.celery import app


logger = logging.getLogger(__name__)
api = get_riot_api()


class RateLimitError(Exception):
    pass


def fetch_match_json(match_id: str, region: str):
    retry_count = -1
    while retry_count < 7:
        retry_count += 1
        try:
            r = api.match.get(match_id, region=region)
        except (MaxRetryError, ConnectionError):
            return
        match = r.content
        if r.status_code == 429:
            if retry_count == 7:
                return "throttled"
            else:
                time.sleep(2**retry_count)
                continue
        elif r.status_code == 404:
            return "not found"
        else:
            return match


def prepare_summoners_from_participants(participants: list[ParticipantModel], region):
    sums = []
    for part in participants:
        if (part.puuid or "").lower() != "bot":
            summoner = Summoner(
                name=part.summonerName.strip(),
                simple_name=part.simple_name,
                region=region.lower(),
                puuid=part.puuid,
                riot_id_name=part.riotIdGameName,
                riot_id_tagline=part.riotIdTagline,
            )
            sums.append(summoner)
    return sums


def pool_match_import(match_id: str, region: str, close_connections=True):
    match_json = fetch_match_json(match_id, region)
    if match_json in ["not found", "throttled", None]:
        pass
    else:
        multi_match_import([match_json], region)
    if close_connections:
        connections.close_all()


def multi_match_import(matches_json, region):
    matches = []
    participants = []
    stats = []
    summoners: list[Summoner] = []
    teams = []
    bans = []
    match_ids_seen = set()
    for match_data in matches_json:
        try:
            parsed = MatchResponseModel.model_validate_json(match_data)
        except ValidationError:
            logger.exception("Match could not be parsed.")
            continue
        if "tutorial" in parsed.info.gameMode.lower():
            continue
        if parsed.info.gameDuration == 0:
            continue
        if parsed.metadata.matchId in match_ids_seen:
            continue
        match_ids_seen.add(parsed.metadata.matchId)
        match = build_match(parsed)
        matches.append(match)
        summoners.extend(
            prepare_summoners_from_participants(parsed.info.participants, region)
        )
        for part in parsed.info.participants:
            participant = build_participant(part, match)
            participants.append(participant)
            stats.append(build_stats(part, participant))
        for tmodel in parsed.info.teams:
            team = build_team(tmodel, match)
            teams.append(team)
            for bm in tmodel.bans:
                bans.append(build_ban(bm, team))

    seen_puuids = set(
        Summoner.objects.filter(
            puuid__in=[x.puuid for x in summoners],
        ).values_list("puuid", flat=True)
    )
    deduped_summoners = []
    for summoner in summoners:
        if summoner.puuid not in seen_puuids:
            seen_puuids.add(summoner.puuid)
            deduped_summoners.append(summoner)
    Summoner.objects.bulk_create(
        deduped_summoners,
        ignore_conflicts=True,
    )
    with transaction.atomic():
        # use update_conflicts so that each model gets their ID applied,
        # even on conflict
        Match.objects.bulk_create(
            matches,
            update_conflicts=True,
            unique_fields=["_id"],
            update_fields=["game_duration"],
        )
        Participant.objects.bulk_create(
            participants,
            update_conflicts=True,
            unique_fields=["_id", "match_id"],
            update_fields=["champion_id"],
        )
        Stats.objects.bulk_create(stats, ignore_conflicts=True)
        Team.objects.bulk_create(
            teams,
            update_conflicts=True,
            unique_fields=["match_id", "_id"],
            update_fields=["win"],
        )
        Ban.objects.bulk_create(bans, ignore_conflicts=True)


class RefreshFeed:
    REFRESH_FEED_LOCK_ID = 237894

    def __init__(self):
        self.cursor = connection.cursor()

    def lock(self, user):
        self.cursor.execute(
            r"SELECT pg_try_advisory_lock(%s, %s);",
            [self.REFRESH_FEED_LOCK_ID, user.id],
        )
        return self.cursor.fetchone()

    def unlock(self, user):
        self.cursor.execute(
            r"SELECT pg_advisory_unlock(%s, %s);", [self.REFRESH_FEED_LOCK_ID, user.id]
        )

    def is_refresh_feed_done(self, user):
        self.cursor.execute(
            r"SELECT * from pg_locks where classid=%s and objid=%s;",
            [self.REFRESH_FEED_LOCK_ID, user.id],
        )
        row = self.cursor.fetchone()
        return not row

    def refresh(self, user):
        summoners = [x.summoner for x in user.follow_set.all()]
        (got_lock,) = self.lock(user)
        if not got_lock:
            logger.warning(f"Could not get refresh_feed lock for {user=}")
            return
        for summoner in summoners:
            import_recent_matches(0, 100, summoner.puuid, summoner.region)
        self.unlock(user)


@app.task(name="match.tasks.import_recent_matches")
def import_recent_matches(
    start: int,
    end: int,
    puuid: str,
    region: str,
    queue: Optional[int] = None,
    queueType: Optional[str] = None,
    startTime: Optional[datetime] = None,
    endTime: Optional[datetime] = None,
    break_on_match_found=False,
):
    has_more = True
    import_count = 0
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
            queueType=queueType,
        )
        retry_count = -1
        matches = []
        while retry_count < 7:
            retry_count += 1
            try:
                r = apicall()
            except (MaxRetryError, ConnectionError):
                matches = []
            else:
                logger.debug("response: %s" % str(r))
                riot_match_request_time = time.time() - riot_match_request_time
                logger.debug(
                    f"Riot API match filter request time : {riot_match_request_time}"
                )
                try:
                    if r.status_code == 404:
                        matches = []
                    else:
                        matches = r.json()
                    break
                except Exception:
                    time.sleep(2**retry_count)
        if len(matches) > 0:
            existing_ids = [x._id for x in Match.objects.filter(_id__in=matches)]
            if existing_ids and break_on_match_found:
                has_more = False
            new_matches = list(set(matches) - set(existing_ids))
            import_count += len(new_matches)
            start_time = time.perf_counter()
            jobs = [(x, region) for x in new_matches]
            if jobs:
                if len(jobs) == 1:
                    pool_match_import(*jobs[0], close_connections=False)
                else:
                    with ThreadPool(processes=min(10, len(jobs))) as pool:
                        pool.starmap(pool_match_import, jobs)
                logger.info(
                    f"ThreadPool match import: {time.perf_counter() - start_time}"
                )
            if len(matches) < size:
                has_more = False
        else:
            has_more = False
        index += size
        if index >= end:
            please_continue = False
    return import_count


@app.task(name="match.tasks.bulk_import")
def bulk_import(puuid: str, last_import_time_hours: int = 24, count=200, offset=10):
    now = timezone.now()
    thresh = now - timedelta(hours=last_import_time_hours)
    summoner: Summoner = Summoner.objects.get(puuid=puuid)
    if (
        summoner.last_summoner_page_import is None
        or summoner.last_summoner_page_import < thresh
    ):
        logger.info(f"Doing summoner page import for {summoner} of {count} games.")
        summoner.last_summoner_page_import = now
        summoner.save()
        import_recent_matches(offset, offset + count, puuid, region=summoner.region)


@app.task
def huge_match_single_summoner_import_job(
    summoner_id, puuid, region, start_time, enqueue_time
):
    enqueue_threshold = timezone.now() - timedelta(hours=6)
    if enqueue_time < enqueue_threshold:
        logger.info("Task older than 6 hours old, skipping.")
        return
    match_count = import_recent_matches(
        0,
        10_000,
        puuid,
        region,
        startTime=start_time,
        queue=420,
    )
    Summoner.objects.filter(id=summoner_id).update(
        huge_match_import_at=timezone.now(),
    )
    return match_count


@app.task(name="match.tasks.huge_match_import_task")
def huge_match_import_task(hours_thresh=24, exclude_hours=6):
    thresh = timezone.now() - timedelta(hours=hours_thresh)

    qs = (
        Summoner.objects.filter(
            Exists(
                Participant.objects.filter(
                    puuid=OuterRef("puuid"),
                    match__queue_id=SOLO_QUEUE,
                    match__game_creation_dt__gt=thresh,
                )
            ),
            puuid__isnull=False,
            region="na",
        )
        .exclude(
            huge_match_import_at__gt=timezone.now() - timedelta(hours=exclude_hours)
        )
        .values("id", "puuid", "region", "huge_match_import_at")
    )

    count = qs.count()
    logger.info(f"Found {count} participants for huge_match_import_task.")
    if not count:
        return

    logger.info(f"Query loop.  Found {count} new participants.")

    for summoner in qs.iterator(2000):
        huge_match_single_summoner_import_job.delay(  # type: ignore
            summoner["id"],
            summoner["puuid"],
            summoner["region"],
            max(thresh, summoner["huge_match_import_at"] or thresh),
            timezone.now(),
        )

    logger.info("enqueued all tasks for huge_match_import_task.")


@app.task(name="match.tasks.import_advanced_timeline")
def import_advanced_timeline(match_id: str | int, overwrite=False):
    victim_damage_received_events: list[VictimDamageReceived] = []
    victim_damage_dealt_events: list[VictimDamageDealt] = []
    ward_placed_events: list[WardPlacedEvent] = []
    ward_kill_events: list[WardKillEvent] = []
    item_purchase_events: list[ItemPurchasedEvent] = []
    item_destroyed_events: list[ItemDestroyedEvent] = []
    item_sold_events: list[ItemSoldEvent] = []
    item_undo_events: list[ItemUndoEvent] = []
    skill_level_up_events: list[SkillLevelUpEvent] = []
    level_up_events: list[LevelUpEvent] = []
    champion_special_kill_events: list[ChampionSpecialKillEvent] = []
    turret_plate_destroyed_events: list[TurretPlateDestroyedEvent] = []
    elite_monster_kill_events: list[EliteMonsterKillEvent] = []
    building_kill_events: list[BuildingKillEvent] = []
    with transaction.atomic():
        match = Match.objects.get(id=match_id)
        if overwrite and hasattr(match, "advancedtimeline_id"):
            assert match.advancedtimeline
            match.advancedtimeline.delete()
        region = match.platform_id.lower()
        logger.info(f"Requesting info for match {match.id} in region {region}")
        try:
            response = api.match.timeline(match._id, region=region)
            start = time.perf_counter()
            parsed = TimelineResponseModel.model_validate_json(response.content)
            logger.info(f"AdvancedTimeline parsing took: {time.perf_counter() - start}")
        except ValidationError:
            logger.exception("AdvancedTimeline could not be parsed.")
            return
        logger.info("Parsed AdvancedTimeline successfully.")
        data = parsed.info
        at = AdvancedTimeline(match=match, frame_interval=data.frameInterval)
        start_writing = time.perf_counter()
        at.save()

        frames_to_save = tuple(
            Frame(timeline=at, timestamp=fm.timestamp) for fm in data.frames
        )
        Frame.objects.bulk_create(frames_to_save)

        pframes = []
        cke_to_save = []
        cke_events: list[tmparsers.ChampionKillEventModel] = []
        for frame, fm in zip(frames_to_save, data.frames):
            for pfm in fm.participantFrames.values():
                stats = pfm.championStats
                dmg_stats = pfm.damageStats
                p_frame_data = {
                    "frame": frame,
                    "participant_id": pfm.participantId,
                    "current_gold": pfm.currentGold,
                    "jungle_minions_killed": pfm.jungleMinionsKilled,
                    "gold_per_second": pfm.goldPerSecond,
                    "level": pfm.level,
                    "minions_killed": pfm.minionsKilled,
                    "time_enemy_spent_controlled": pfm.timeEnemySpentControlled,
                    "total_gold": pfm.totalGold,
                    "xp": pfm.xp,
                    "x": pfm.position.x,
                    "y": pfm.position.y,
                    "ability_haste": stats.abilityHaste,
                    "ability_power": stats.abilityPower,
                    "armor": stats.armor,
                    "armor_pen": stats.armorPen,
                    "armor_pen_percent": stats.armorPenPercent,
                    "attack_damage": stats.attackDamage,
                    "attack_speed": stats.attackSpeed,
                    "bonus_armor_pen_percent": stats.bonusArmorPenPercent,
                    "bonus_magic_pen_percent": stats.bonusMagicPenPercent,
                    "cc_reduction": stats.ccReduction,
                    "cooldown_reduction": stats.cooldownReduction,
                    "health": stats.health,
                    "health_max": stats.healthMax,
                    "health_regen": stats.healthRegen,
                    "lifesteal": stats.lifesteal,
                    "magic_pen": stats.magicPen,
                    "magic_pen_percent": stats.magicPenPercent,
                    "magic_resist": stats.magicResist,
                    "movement_speed": stats.movementSpeed,
                    "omnivamp": stats.omnivamp,
                    "physical_vamp": stats.physicalVamp,
                    "power": stats.power,
                    "power_max": stats.powerMax,
                    "power_regen": stats.powerRegen,
                    "spell_vamp": stats.spellVamp,
                    "magic_damage_done": dmg_stats.magicDamageDone,
                    "magic_damage_done_to_champions": dmg_stats.magicDamageDoneToChampions,
                    "magic_damage_taken": dmg_stats.magicDamageTaken,
                    "physical_damage_done": dmg_stats.physicalDamageDone,
                    "physical_damage_done_to_champions": dmg_stats.physicalDamageDoneToChampions,
                    "physical_damage_taken": dmg_stats.physicalDamageTaken,
                    "total_damage_done": dmg_stats.totalDamageDone,
                    "total_damage_done_to_champions": dmg_stats.totalDamageDoneToChampions,
                    "total_damage_taken": dmg_stats.totalDamageTaken,
                    "true_damage_done": dmg_stats.trueDamageDone,
                    "true_damage_done_to_champions": dmg_stats.trueDamageDoneToChampions,
                    "true_damage_taken": dmg_stats.trueDamageTaken,
                }
                pframes.append(ParticipantFrame(**p_frame_data))

            for evm in fm.events:
                assert frame.id
                match evm:
                    case tmparsers.WardPlacedEventModel():
                        ward_placed_events.append(
                            WardPlacedEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                creator_id=evm.creatorId,
                                ward_type=evm.wardType,
                            )
                        )
                    case tmparsers.WardKillEventModel():
                        ward_kill_events.append(
                            WardKillEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                killer_id=evm.killerId,
                                ward_type=evm.wardType,
                            )
                        )
                    case tmparsers.PauseEndEventModel():
                        ...
                    case tmparsers.PauseStartEventModel():
                        ...
                    case tmparsers.ObjectiveBountyPrestartEventModel():
                        ...
                    case tmparsers.ObjectiveBountyFinishEventModel():
                        ...
                    case tmparsers.ChampionTransformEventModel():
                        ...
                    case tmparsers.DragonSoulGivenEventModel():
                        ...
                    case tmparsers.ItemDestroyedEventModel():
                        item_destroyed_events.append(
                            ItemDestroyedEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                item_id=evm.itemId,
                                participant_id=evm.participantId,
                            )
                        )
                    case tmparsers.ItemSoldEventModel():
                        item_sold_events.append(
                            ItemSoldEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                item_id=evm.itemId,
                                participant_id=evm.participantId,
                            )
                        )
                    case tmparsers.ItemPurchasedEventModel():
                        item_purchase_events.append(
                            ItemPurchasedEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                item_id=evm.itemId,
                                participant_id=evm.participantId,
                            )
                        )
                    case tmparsers.ItemUndoEventModel():
                        item_undo_events.append(
                            ItemUndoEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                participant_id=evm.participantId,
                                before_id=evm.beforeId,
                                after_id=evm.afterId,
                                gold_gain=evm.goldGain,
                            )
                        )
                    case tmparsers.SkillLevelUpEventModel():
                        skill_level_up_events.append(
                            SkillLevelUpEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                level_up_type=evm.levelUpType,
                                participant_id=evm.participantId,
                                skill_slot=evm.skillSlot,
                            )
                        )
                    case tmparsers.LevelUpModel():
                        level_up_events.append(
                            LevelUpEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                level=evm.level,
                                participant_id=evm.participantId,
                            )
                        )
                    case tmparsers.ChampionSpecialKillEventModel():
                        champion_special_kill_events.append(
                            ChampionSpecialKillEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                assisting_participant_ids=evm.assistingParticipantIds,
                                kill_type=evm.killType,
                                killer_id=evm.killerId,
                                multi_kill_length=evm.multiKillLength,
                                x=evm.position.x,
                                y=evm.position.y,
                            )
                        )
                    case tmparsers.TurretPlateDestroyedEventModel():
                        turret_plate_destroyed_events.append(
                            TurretPlateDestroyedEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                killer_id=evm.killerId,
                                lane_type=evm.laneType,
                                x=evm.position.x,
                                y=evm.position.y,
                                team_id=evm.teamId,
                            )
                        )
                    case tmparsers.EliteMonsterKillEventModel():
                        elite_monster_kill_events.append(
                            EliteMonsterKillEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                killer_id=evm.killerId,
                                killer_team_id=evm.killerTeamId,
                                bounty=evm.bounty,
                                x=evm.position.x,
                                y=evm.position.y,
                                monster_type=evm.monsterType,
                                monster_sub_type=evm.monsterSubType,
                            )
                        )
                    case tmparsers.BuildingKillEventModel():
                        building_kill_events.append(
                            BuildingKillEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                killer_id=evm.killerId,
                                bounty=evm.bounty,
                                x=evm.position.x,
                                y=evm.position.y,
                                building_type=evm.buildingType,
                                lane_type=evm.laneType,
                                tower_type=evm.towerType,
                                team_id=evm.teamId,
                            )
                        )
                    case tmparsers.GameEndEventModel():
                        GameEndEvent.objects.create(
                            frame_id=frame.id,
                            timestamp=evm.timestamp,
                            game_id=evm.gameId,
                            real_timestamp=evm.realTimestamp,
                            winning_team=evm.winningTeam,
                        )
                    case tmparsers.ChampionKillEventModel():
                        cke_to_save.append(
                            ChampionKillEvent(
                                frame_id=frame.id,
                                timestamp=evm.timestamp,
                                bounty=evm.bounty,
                                shutdown_bounty=evm.shutdownBounty,
                                kill_streak_length=evm.killStreakLength,
                                killer_id=evm.killerId,
                                victim_id=evm.victimId,
                                x=evm.position.x,
                                y=evm.position.y,
                            )
                        )
                        cke_events.append(evm)
                    case tmparsers.FeatUpdateEventModel():
                        ...
                    case _:
                        assert_never(evm)
        ChampionKillEvent.objects.bulk_create(cke_to_save, batch_size=50)
        for cke, evm in zip(cke_to_save, cke_events):
            for vd in evm.victimDamageDealt or []:
                victim_damage_dealt_events.append(
                    VictimDamageDealt(
                        championkillevent_id=cke.id,
                        basic=vd.basic,
                        magic_damage=vd.magicDamage,
                        name=vd.name,
                        participant_id=vd.participantId,
                        physical_damage=vd.physicalDamage,
                        spell_name=vd.spellName,
                        spell_slot=vd.spellSlot,
                        true_damage=vd.trueDamage,
                        type=vd.type,
                    )
                )
            for vd in evm.victimDamageReceived or []:
                victim_damage_received_events.append(
                    VictimDamageReceived(
                        championkillevent_id=cke.id,
                        basic=vd.basic,
                        magic_damage=vd.magicDamage,
                        name=vd.name,
                        participant_id=vd.participantId,
                        physical_damage=vd.physicalDamage,
                        spell_name=vd.spellName,
                        spell_slot=vd.spellSlot,
                        true_damage=vd.trueDamage,
                        type=vd.type,
                    )
                )
        ParticipantFrame.objects.bulk_create(pframes, batch_size=50)
        WardPlacedEvent.objects.bulk_create(ward_placed_events)
        WardKillEvent.objects.bulk_create(ward_kill_events)
        ItemPurchasedEvent.objects.bulk_create(item_purchase_events)
        ItemDestroyedEvent.objects.bulk_create(item_destroyed_events)
        ItemSoldEvent.objects.bulk_create(item_sold_events)
        ItemUndoEvent.objects.bulk_create(item_undo_events)
        SkillLevelUpEvent.objects.bulk_create(skill_level_up_events)
        LevelUpEvent.objects.bulk_create(level_up_events)
        ChampionSpecialKillEvent.objects.bulk_create(champion_special_kill_events)
        TurretPlateDestroyedEvent.objects.bulk_create(turret_plate_destroyed_events)
        EliteMonsterKillEvent.objects.bulk_create(elite_monster_kill_events)
        BuildingKillEvent.objects.bulk_create(building_kill_events)
        VictimDamageDealt.objects.bulk_create(victim_damage_dealt_events, batch_size=50)
        VictimDamageReceived.objects.bulk_create(
            victim_damage_received_events, batch_size=50
        )
        end_writing = time.perf_counter()
        logger.info(f"Writing Advanced Timeline took {end_writing - start_writing}.")


def import_spectate_from_data(parsed: SpectateModel, region: str):
    spectate_data = {
        "game_id": parsed.gameId,
        "region": region,
        "platform_id": parsed.platformId,
        "encryption_key": parsed.observers.encryptionKey,
    }
    spectate = Spectate(**spectate_data)
    try:
        spectate.save()
    except IntegrityError:
        # already saved
        pass


def import_summoners_from_spectate(parsed: SpectateModel, region):
    summoner_list = []
    for part in parsed.participants:
        if part.riotId:
            name, tagline = part.riotId.split("#")
            sum_data = {
                "puuid": part.puuid,
                "riot_id_name": name,
                "riot_id_tagline": tagline,
                "region": region,
                "profile_icon_id": part.profileIconId,
            }
            summoner_list.append(Summoner(**sum_data))
    Summoner.objects.bulk_create(
        summoner_list,
        update_conflicts=True,
        update_fields=["profile_icon_id"],
        unique_fields=["puuid"],
    )
    return {x.puuid: x for x in summoner_list}


def get_player_ranks(summoner_list, threshold_days=1, sync=True):
    logger.info("Applying player ranks.")
    jobs = [(x.id, threshold_days) for x in summoner_list]
    if jobs:
        if sync:
            for x in jobs:
                pt.import_positions(*x)
        else:
            with ThreadPool(processes=10) as pool:

                def pool_position_import(a, b):
                    pt.import_positions(a, b)
                    connections.close_all()

                start_time = time.perf_counter()
                pool.starmap(pool_position_import, jobs)
                logger.info(
                    f"ThreadPool positions import: {time.perf_counter() - start_time}"
                )


def apply_player_ranks(match, threshold_days=1):
    if not isinstance(match, Match):
        match = Match.objects.get(id=match)
    one_day_ago = timezone.now() - timedelta(days=1)
    if match.get_creation() <= one_day_ago:
        return
    # ok -- apply ranks
    parts = match.participants.all()
    summoner_list = list(
        Summoner.objects.filter(puuid__in=[part.puuid for part in parts]).annotate(
            most_recent_position_id=RankPosition.objects.filter(
                checkpoint__summoner_id=OuterRef('id'),
                queue_type='RANKED_SOLO_5x5',
            ).order_by('-checkpoint__created_date').values('id')[:1],
        )
    )
    positions = {rank.id: rank for rank in RankPosition.objects.filter(
        id__in=[x.most_recent_position_id for x in summoner_list if x is not None]  # type: ignore
    )}
    summoners = {x.puuid: x for x in summoner_list}

    get_player_ranks(summoner_list, threshold_days=threshold_days, sync=False)

    to_save = []
    for part in parts:
        if part.tier:
            continue

        # only applying if it is not already applied
        summoner = summoners.get(part.puuid)
        if not summoner:
            continue

        if not summoner.most_recent_position_id:  # type: ignore
            continue

        position = positions[summoner.most_recent_position_id]  # type: ignore

        part.rank, part.tier = position.rank, position.tier
        to_save.append(part)
    if to_save:
        Participant.objects.bulk_update(to_save, fields=["rank", "tier"])


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


def get_sorted_participants(match: Match, participants=None):
    if not participants:
        participants = match.participants.all().select_related("stats")
    if len(participants) == 10:
        ordered = sorted(list(participants), key=participant_key)
    elif match.queue_id == ARENA_QUEUE:
        ordered = sorted(list(participants), key=lambda x: x.placement)
    else:
        ordered = list(participants)
    return ordered


def build_participant(part: ParticipantModel, match: Match):
    return Participant(
        match=match,
        _id=part.participantId,
        puuid=part.puuid,
        summoner_name=part.summonerName,
        summoner_name_simplified=part.simple_name,
        champion_id=part.championId,
        champ_experience=part.champExperience,
        summoner_1_id=part.summoner1Id,
        summoner_1_casts=part.summoner1Casts,
        summoner_2_id=part.summoner2Id,
        summoner_2_casts=part.summoner2Casts,
        team_id=part.teamId,
        lane=part.lane,
        role=part.role,
        individual_position=part.individualPosition,
        team_position=part.teamPosition,
        placement=part.placement,
        subteam_placement=part.subteamPlacement,
        riot_id_name=part.riotIdGameName,
        riot_id_tagline=part.riotIdTagline,
        role_bound_item=part.roleBoundItem,
    )


def build_team(team: TeamModel, match: Match):
    return Team(
        match=match,
        _id=team.teamId,
        baron_kills=team.objectives.baron.kills,
        first_baron=team.objectives.baron.first,
        dragon_kills=team.objectives.dragon.kills,
        first_dragon=team.objectives.dragon.first,
        first_blood=team.objectives.champion.first,
        first_inhibitor=team.objectives.inhibitor.first,
        inhibitor_kills=team.objectives.inhibitor.kills,
        first_rift_herald=team.objectives.riftHerald.first,
        rift_herald_kills=team.objectives.riftHerald.kills,
        first_tower=team.objectives.tower.first,
        tower_kills=team.objectives.tower.kills,
        win=team.win,
    )


def build_ban(ban: BanType, team: Team):
    return Ban(
        champion_id=ban.championId,
        pick_turn=ban.pickTurn,
        team=team,
    )


def build_stats(part: ParticipantModel, participant: Participant | None = None):
    return Stats(
        participant=participant,
        all_in_pings=part.allInPings,
        assist_me_pings=part.assistMePings,
        bait_pings=part.baitPings,
        basic_pings=part.basicPings,
        command_pings=part.commandPings,
        danger_pings=part.dangerPings,
        enemy_missing_pings=part.enemyMissingPings,
        enemy_vision_pings=part.enemyVisionPings,
        get_back_pings=part.getBackPings,
        hold_pings=part.holdPings,
        need_vision_pings=part.needVisionPings,
        on_my_way_pings=part.onMyWayPings,
        push_pings=part.pushPings,
        vision_cleared_pings=part.visionClearedPings,
        game_ended_in_early_surrender=part.gameEndedInEarlySurrender,
        game_ended_in_surrender=part.gameEndedInSurrender,
        assists=part.assists,
        champ_level=part.champLevel,
        damage_dealt_to_objectives=part.damageDealtToObjectives,
        damage_dealt_to_turrets=part.damageDealtToTurrets,
        damage_self_mitigated=part.damageSelfMitigated,
        damage_dealt_to_epic_monsters=part.damageDealtToEpicMonsters,
        deaths=part.deaths,
        double_kills=part.doubleKills,
        first_blood_assist=part.firstBloodAssist,
        first_blood_kill=part.firstBloodKill,
        first_tower_assist=part.firstTowerAssist,
        first_tower_kill=part.firstTowerKill,
        gold_earned=part.goldEarned,
        inhibitor_kills=part.inhibitorKills,
        item_0=part.item0,
        item_1=part.item1,
        item_2=part.item2,
        item_3=part.item3,
        item_4=part.item4,
        item_5=part.item5,
        item_6=part.item6,
        kills=part.kills,
        largest_multi_kill=part.largestMultiKill,
        magic_damage_dealt=part.magicDamageDealt,
        magic_damage_dealt_to_champions=part.magicDamageDealtToChampions,
        physical_damage_dealt=part.physicalDamageDealt,
        physical_damage_dealt_to_champions=part.physicalDamageDealtToChampions,
        magical_damage_taken=part.magicDamageTaken,
        neutral_minions_killed=part.neutralMinionsKilled,
        penta_kills=part.pentaKills,
        stat_perk_0=part.stat_perk_0,
        stat_perk_1=part.stat_perk_1,
        stat_perk_2=part.stat_perk_2,
        perk_0=part.perks.primary_style.selections[0].perk,
        perk_1=part.perks.primary_style.selections[1].perk,
        perk_2=part.perks.primary_style.selections[2].perk,
        perk_3=part.perks.primary_style.selections[3].perk,
        perk_4=part.perks.sub_style.selections[0].perk,
        perk_5=part.perks.sub_style.selections[1].perk,
        perk_0_var_1=part.perks.primary_style.selections[0].var1,
        perk_1_var_1=part.perks.primary_style.selections[1].var1,
        perk_2_var_1=part.perks.primary_style.selections[2].var1,
        perk_3_var_1=part.perks.primary_style.selections[3].var1,
        perk_4_var_1=part.perks.sub_style.selections[0].var1,
        perk_5_var_1=part.perks.sub_style.selections[1].var1,
        perk_0_var_2=part.perks.primary_style.selections[0].var2,
        perk_1_var_2=part.perks.primary_style.selections[1].var2,
        perk_2_var_2=part.perks.primary_style.selections[2].var2,
        perk_3_var_2=part.perks.primary_style.selections[3].var2,
        perk_4_var_2=part.perks.sub_style.selections[0].var2,
        perk_5_var_2=part.perks.sub_style.selections[1].var2,
        perk_0_var_3=part.perks.primary_style.selections[0].var3,
        perk_1_var_3=part.perks.primary_style.selections[1].var3,
        perk_2_var_3=part.perks.primary_style.selections[2].var3,
        perk_3_var_3=part.perks.primary_style.selections[3].var3,
        perk_4_var_3=part.perks.sub_style.selections[0].var3,
        perk_5_var_3=part.perks.sub_style.selections[1].var3,
        perk_primary_style=part.perks.primary_style.style,
        perk_sub_style=part.perks.sub_style.style,
        spell_1_casts=part.spell1Casts,
        spell_2_casts=part.spell2Casts,
        spell_3_casts=part.spell3Casts,
        spell_4_casts=part.spell4Casts,
        time_ccing_others=part.timeCCingOthers,
        total_damage_dealt=part.totalDamageDealt,
        total_damage_dealt_to_champions=part.totalDamageDealtToChampions,
        total_damage_taken=part.totalDamageTaken,
        total_damage_shielded_on_teammates=part.totalDamageShieldedOnTeammates,
        total_heal=part.totalHeal,
        total_heals_on_teammates=part.totalHealsOnTeammates,
        total_minions_killed=part.totalMinionsKilled,
        total_time_crowd_control_dealt=part.totalTimeCCDealt,
        total_units_healed=part.totalUnitsHealed,
        total_ally_jungle_minions_killed=part.totalAllyJungleMinionsKilled or 0,
        total_enemy_jungle_minions_killed=part.totalEnemyJungleMinionsKilled or 0,
        triple_kills=part.tripleKills,
        true_damage_dealt=part.trueDamageDealt,
        true_damage_dealt_to_champions=part.trueDamageDealtToChampions,
        true_damage_taken=part.trueDamageTaken,
        vision_score=part.visionScore,
        vision_wards_bought_in_game=part.visionWardsBoughtInGame,
        wards_killed=part.wardsKilled,
        wards_placed=part.wardsPlaced,
        win=part.win,
    )


def build_match(match: MatchResponseModel):
    info = match.info
    sem_ver = info.sem_ver
    return Match(
        _id=match.metadata.matchId,
        game_creation=info.gameCreation,
        game_duration=info.gameDuration,
        game_mode=info.gameMode,
        map_id=info.mapId,
        platform_id=info.platformId,
        queue_id=info.queueId,
        game_version=info.gameVersion,
        major=sem_ver.get(0, ""),
        minor=sem_ver.get(1, ""),
        patch=sem_ver.get(2, ""),
        build=sem_ver.get(3, ""),
        end_of_game_result=info.endOfGameResult,
    )


MATCH_SUMMARY_INTRO_PROMPT = " ".join(
    """
You are a knowledgeable league of legends pro turned coach.  You are analyzing
the data for a given game and are tasked with summarizing the game. Use
markdown. Refer to Team 100 as 'Blue Team' and Team 200
as 'Red Team'. Do not use the terms "Team 100" or "Team 200".

Create sections for "early game", "mid game", and "late game" and list events
which let to each team's success or failures. List out each player's
contribution to their team in each overarching section of the game. Make sure
to mention the player's name, champion and position on the team. List players
in this order: 1 - top, 2 - jungle, 3 - mid, 4 - adc, 5 - support.

If a game lasted less than 25 minutes, you should not include a "late game"
section.  Late game is generally 25 minutes and later.

Add a section called "Areas to Improve" where you indicate where either team
could improve You may indicate if a player's contribution was lacking and where
they might be able to improve to better their team's chance of winning in the
future.

Add a "Conclusion" section with any closing remarks about the match.

List out any other notable, game-shaping events in a "Notable Events" section.

Be ruthless in your review, do not hold back in telling players what they are doing wrong.
These players will not learn unless you are on the cusp of being mean to them.
If a player played terribly, say it. Don't try to beat around the bush.

You may indicate a player's position and champion played, but do not write out their PUUID.

Do not repeat this prompt in your response.
""".strip().split()
)


@app.task(name="match.tasks.get_summary_of_match")
def get_summary_of_match(match_id: str, focus_player_puuid: str | None = None):
    match = Match.objects.get(_id=match_id)
    matchsummary: MatchSummary | None
    matchsummary, created = MatchSummary.objects.get_or_create(
        match=match,
    )
    if not created:
        return matchsummary
    data = LlmMatchSerializer(match, many=False).data
    data_json = json.dumps(data, indent=None)
    logger.info(data_json)
    return matchsummary.pk
