"""match/viewsapi.py
"""
from rest_framework.response import Response
from rest_framework.decorators import api_view

from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger
from match import tasks as mt
from player import tasks as pt

from .models import Match, Participant

from .models import sort_positions

from player.models import Summoner, simplify

from data.models import Champion, Item, ReforgedRune

from .serializers import MatchSerializer

from player.serializers import RankPositionSerializer

from multiprocessing.dummy import Pool as ThreadPool

from django.core.cache import cache


@api_view(["POST"])
def get_match_timeline(request, format=None):
    """Gets match timeline from Riot's API.

    This is a tunnel.

    POST Parameters
    ---------------
    match_id : ID
        Riot's match ID

    Returns
    -------
    JSON Timeline Data

    """
    data = {}
    status_code = 200
    cache_seconds = 60 * 60 * 2
    api = get_riot_api()
    if api:
        match_id = request.data.get("match_id", None)
        if request.method == "POST":
            match = Match.objects.get(_id=match_id)
            try:
                timeline = match.advancedtimeline
            except:
                mt.import_advanced_timeline(match.id)
                match.refresh_from_db()
                timeline = match.advancedtimeline

            cache_key = f"match/{match._id}/timeline"
            cache_data = cache.get(cache_key)
            if cache_data:
                data = cache_data["data"]
                status_code = cache_data["status"]
            else:
                timeline_data = []
                for frame in (
                    timeline.frames.all()
                    .prefetch_related(
                        "participantframes", "events", "events__assistingparticipants"
                    )
                    .order_by("timestamp")
                ):
                    frame_data = {
                        "timestamp": frame.timestamp,
                    }
                    participantframes = []
                    for pframe in frame.participantframes.all():
                        pframe = {
                            "participant_id": pframe.participant_id,
                            "current_gold": pframe.current_gold,
                            # 'dominion_score': pframe.dominion_score,
                            "jungle_minions_killed": pframe.jungle_minions_killed,
                            "level": pframe.level,
                            "minions_killed": pframe.minions_killed,
                            "x": pframe.x,
                            "y": pframe.y,
                            "team_score": pframe.team_score,
                            "total_gold": pframe.total_gold,
                            "xp": pframe.xp,
                        }
                        participantframes.append(pframe)

                    events = []
                    for event in frame.events.all():
                        event_data = {
                            "_type": event._type,
                            "participant_id": event.participant_id,
                            "timestamp": event.timestamp,
                            "item_id": event.item_id,
                            "level_up_type": event.level_up_type,
                            "skill_slot": event.skill_slot,
                            "ward_type": event.ward_type,
                            "before_id": event.before_id,
                            "after_id": event.after_id,
                            "killer_id": event.killer_id,
                            "victim_id": event.victim_id,
                            "x": event.x,
                            "y": event.y,
                            "monster_type": event.monster_type,
                            "monster_sub_type": event.monster_sub_type,
                            "building_type": event.building_type,
                            "lane_type": event.lane_type,
                            "team_id": event.team_id,
                            "tower_type": event.tower_type,
                            "assistingparticipants": [
                                x.participant_id
                                for x in event.assistingparticipants.all()
                            ],
                        }
                        events.append(event_data)

                    frame_data["participantframes"] = participantframes
                    frame_data["events"] = events
                    timeline_data.append(frame_data)
                data = {"data": timeline_data}

                new_cache = {"data": data, "status": status_code}
                cache.set(cache_key, new_cache, cache_seconds)

    return Response(data, status=status_code)


@api_view(["POST"])
@query_debugger
def get_match(request, format=None):
    """Get a match and basic data about it.

    Parameters
    ----------
    match_id : int
    match_id_internal : int

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        match_id = request.data.get("match_id")
        match_id_internal = request.data.get("match_id_internal")

        if match_id is not None:
            query = Match.objects.filter(_id=match_id)
        else:
            query = Match.objects.filter(id=match_id_internal)

        if query:
            match = query[0]
            if request.user.is_authenticated:
                op_summoners = [
                    x
                    for x in Summoner.objects.filter(summonerlinks__user=request.user)
                    if x.summonerlinks.get(user=request.user).verified is True
                ]
            else:
                op_summoners = []
            summoner_name = None
            for pot_sum in op_summoners:
                if match.is_summoner_in_game(pot_sum):
                    summoner_name = pot_sum.simple_name
            serializer = MatchSerializer(match, summoner_name=summoner_name)
            data = {"data": serializer.data}
        else:
            data = {"message": "Match not found."}
            status_code = 404
    else:
        data = {"message": "Only POST allowed."}
        status_code = 403
    return Response(data, status=status_code)


@api_view(["POST"])
@query_debugger
def get_participants(request, format=None):
    """

    POST Parameters
    ---------------
    match_id : ID
        Internal match ID
    match__id : ID
        RIOT match ID
    language : str
        default - 'en_US'
    apply_ranks : bool
        attempt to apply each player's rank to their
        participant data.

    Returns
    -------
    Participant JSON

    """
    data = {}
    status_code = 200
    cache_seconds = 60 * 60 * 24

    if request.method == "POST":
        match_id = request.data.get("match_id")
        match__id = request.data.get("match__id")
        language = request.data.get("language", "en_US")
        apply_ranks = request.data.get("apply_ranks", False)
        if match_id:
            match = Match.objects.get(id=match_id)
        else:
            match = Match.objects.get(_id=match__id)

        cache_key = f"match/{match._id}/participants"
        cache_data = cache.get(cache_key)
        if cache_data:
            data = cache_data["data"]
            status_code = cache_data["status"]
        else:
            if apply_ranks:
                mt.apply_player_ranks(match.id, threshold_days=1)
            participants = []

            part_query = mt.get_sorted_participants(match)
            if len(part_query) != match.participants.count():
                part_query = match.participants.all().select_related("stats")

            all_champs = Champion.objects.filter(
                key__in=set(part.champion_id for part in part_query),
                language=language,
            ).order_by('key', '-major', '-minor').distinct(
                'key',
            ).select_related('image')
            champ_data = {x.key: x for x in all_champs}

            all_items = set()
            all_runes = set()
            for part in part_query:
                for _i in range(7):
                    all_items.add(getattr(part.stats, f'item_{_i}'))

                for _i in range(6):
                    all_runes.add(getattr(part.stats, f'perk_{_i}'))
            item_data = Item.objects.filter(
                _id__in=all_items,
            ).order_by(
                '_id', '-major', '-minor',
            ).distinct('_id').select_related('image')
            item_data = {x._id: x for x in item_data}

            rune_data = ReforgedRune.objects.filter(
                _id__in=all_runes,
            ).order_by(
                '_id', '-reforgedtree__major', 'reforgedtree__minor'
            ).distinct('_id')
            rune_data = {x._id: x for x in rune_data}

            for part in part_query:
                p = {
                    "id": part.id,
                    "_id": part._id,
                    "account_id": part.account_id,
                    "current_account_id": part.current_account_id,
                    "summoner_id": part.summoner_id,
                    "current_platform_id": part.current_platform_id,
                    "platform_id": part.platform_id,
                    "summoner_name": part.summoner_name,
                    "highest_achieved_season_tier": part.highest_achieved_season_tier,
                    "spell_1_id": part.spell_1_id,
                    "spell_1_image_url": part.spell_1_image_url(),
                    "spell_2_id": part.spell_2_id,
                    "spell_2_image_url": part.spell_2_image_url(),
                    "team_id": part.team_id,
                    "lane": part.lane,
                    "role": part.role,
                    "tier": part.tier,
                    "rank": part.rank,
                }
                champion = champ_data[part.champion_id]
                p["champion"] = {
                    "_id": champion._id if champion is not None else 'NA',
                    "name": champion.name if champion is not None else 'NA',
                    "key": champion.key if champion is not None else 'NA',
                    "image_url": champion.image_url() if champion is not None else '',
                }
                try:
                    stats = part.stats
                except:
                    stats = None
                if stats:
                    p["stats"] = {
                        "champ_level": stats.champ_level,
                        "assists": stats.assists,
                        "damage_dealt_to_objectives": stats.damage_dealt_to_objectives,
                        "damage_dealt_to_turrets": stats.damage_dealt_to_turrets,
                        "damage_self_mitigated": stats.damage_self_mitigated,
                        "deaths": stats.deaths,
                        "gold_earned": stats.gold_earned,
                        "kills": stats.kills,
                        "largest_multi_kill": stats.largest_multi_kill,
                        "magic_damage_dealt": stats.magic_damage_dealt,
                        "magic_damage_dealt_to_champions": stats.magic_damage_dealt_to_champions,
                        "magical_damage_taken": stats.magical_damage_taken,
                        "neutral_minions_killed": stats.neutral_minions_killed,
                        "neutral_minions_killed_enemy_jungle": stats.neutral_minions_killed_enemy_jungle,
                        "neutral_minions_killed_team_jungle": stats.neutral_minions_killed_team_jungle,
                        "perk_primary_style": stats.perk_primary_style,
                        "perk_sub_style": stats.perk_sub_style,
                        "perk_sub_style_image_url": stats.perk_sub_style_image_url(),
                        "stat_perk_0": stats.stat_perk_0,
                        "stat_perk_1": stats.stat_perk_1,
                        "stat_perk_2": stats.stat_perk_2,
                        "physical_damage_dealt_to_champions": stats.physical_damage_dealt_to_champions,
                        "physical_damage_taken": stats.physical_damage_taken,
                        "time_ccing_others": stats.time_ccing_others,
                        "total_damage_dealt_to_champions": stats.total_damage_dealt_to_champions,
                        "total_damage_taken": stats.total_damage_taken,
                        "total_heal": stats.total_heal,
                        "total_minions_killed": stats.total_minions_killed,
                        "total_time_crowd_control_dealt": stats.total_time_crowd_control_dealt,
                        "total_units_healed": stats.total_units_healed,
                        "true_damage_dealt_to_champions": stats.true_damage_dealt_to_champions,
                        "true_damage_taken": stats.true_damage_taken,
                        "vision_score": stats.vision_score,
                        "vision_wards_bought_in_game": stats.vision_wards_bought_in_game,
                        "wards_killed": stats.wards_killed,
                        "wards_placed": stats.wards_placed,
                    }

                    # items
                    for _i in range(7):
                        key = f'item_{_i}'
                        item_id = getattr(stats, key)
                        p['stats'][key] = item_id
                        item = item_data.get(item_id)
                        p['stats'][f'{key}_image_url'] = item.image.image_url() if item else None

                    # runes
                    for _i in range(6):
                        key = f'perk_{_i}'
                        perk_id = getattr(stats, key)
                        p['stats'][key] = perk_id
                        rune = rune_data.get(perk_id)
                        p['stats'][f'{key}'] = perk_id
                        p['stats'][f'{key}_image_url'] = rune.image_url() if rune else None
                        for _j in range(1, 4):
                            var = f'{key}_var_{_j}'
                            p['stats'][var] = getattr(stats, var)

                participants.append(p)
            # participants.sort(key=lambda x: participant_sort(x))

            data = {"data": participants}

            new_cache = {"data": data, "status": status_code}
            cache.set(cache_key, new_cache, cache_seconds)
    return Response(data, status=status_code)


@api_view(["POST"])
def get_spectate(request, format=None):
    """Get spectate data, augmented with internal data

    Returns
    -------
    JSON - augmented spectate data

    """
    data = {}
    status_code = 200
    pool = ThreadPool(10)

    if request.method == "POST":
        summoner_id = request.data["summoner_id"]
        region = request.data["region"]
        api = get_riot_api()
        r = api.spectator.get(summoner_id, region)
        spectate_data = r.json()
        if r.status_code == 404:
            data = {"message": "No live game found."}
            status_code = 404
        else:
            mt.import_spectate_from_data(spectate_data, region)
            summoners = mt.import_summoners_from_spectate(spectate_data, region)
            pool.map(
                lambda x: pt.import_positions(x, threshold_days=3, close=True),
                summoners.values(),
            )
            for part in spectate_data["participants"]:
                positions = None
                query = Summoner.objects.filter(region=region, _id=part["summonerId"])
                if query.exists():
                    summoner = query.first()
                    checkpoint = summoner.get_newest_rank_checkpoint()
                    positions = RankPositionSerializer(
                        checkpoint.positions.all(), many=True
                    ).data
                    positions = sort_positions(positions)
                part["positions"] = positions

                query = Champion.objects.filter(key=part["championId"]).order_by(
                    "-version"
                )
                if query.exists():
                    champion = query.first()
                    part["champion"] = {
                        "name": champion.name,
                        "image_url": champion.image_url(),
                    }

            data = {"data": spectate_data}

    return Response(data, status=status_code)


@api_view(["POST"])
def check_for_live_game(request, format=None):
    """Quickly check if a summoner is in a game.

    Returns
    -------
    Riot Spectate JSON Response

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        summoner_id = request.data["summoner_id"]
        region = request.data["region"]
        api = get_riot_api()
        r = api.spectator.get(summoner_id, region)
        data = {"data": r.json()}
        status_code = r.status_code

    return Response(data, status=status_code)


@api_view(["POST"])
def set_role_label(request, format=None):
    """

    Parameters
    ----------
    participant_id : int
    role : int
        0=top, 1=jg, 2=mid, 3=adc, 4=sup

    Returns
    -------
    None

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        if request.user.is_superuser:
            role = request.data["role"]
            participant_id = request.data["participant_id"]
            p = Participant.objects.get(id=participant_id)
            p.role_label = role
            p.save()
            data = {
                "message": f"set participant {p.summoner_name} to role {p.role_label}"
            }
    return Response(data, status=status_code)


@api_view(["POST"])
def get_latest_unlabeled_match(request, format=None):
    """Retrieve newest game without role labels.

    Parameters
    ----------
    None

    Returns
    -------
    Match JSON

    """
    p = (
        Participant.objects.filter(role_label=None, match__queue_id=420)
        .order_by("-match__game_creation")
        .first()
    )
    match = p.match
    serializer = MatchSerializer(match)
    data = {"data": serializer.data}
    return Response(data)


def _get_played_together(summoner_names):
    simplified_names = [simplify(x) for x in summoner_names]
    if simplified_names:
        qs = Match.objects.all()
        for name in simplified_names:
            qs = qs.filter(participants__summoner_name_simplified=name)
    else:
        qs = Match.objects.none()
    return qs


@api_view(['GET'])
def get_played_together(request, format=None):
    """Get a count of games played together

    Parameters
    ----------
    summoner_names: list
    region: str

    Returns
    -------
    json
        {count: int}

    """
    summoner_names = request.GET.get('summoner_names')
    qs = _get_played_together(summoner_names)
    data = {'count': qs.count()}
    return Response(data)
