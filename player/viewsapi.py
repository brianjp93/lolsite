"""player.viewsapi
"""
# pylint: disable=W0613, W0622, W0212, bare-except, broad-except
from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.db.models.functions import Extract
from django.db.models import Max, Min

from lolsite.tasks import get_riot_api

from player import tasks as pt
from player import filters as player_filters
from player.models import EmailVerification, RankPosition
from player.models import Favorite, SummonerLink
from player.models import decode_int_to_rank, validate_password

from data.constants import IS_PRINT_TIMERS
from data.models import ProfileIcon, Champion
from data.serializers import ProfileIconSerializer

from match import tasks as mt
from match.models import Match

from match.models import sort_positions

from .models import Summoner
from .serializers import SummonerSerializer
from .serializers import RankPositionSerializer
from .serializers import FavoriteSerializer

import time
import json


@api_view(["POST"])
def get_summoner(request, format=None):
    """

    POST Parameters
    ---------------
    name : str
    account_id : str
    region : str
    update : bool
        Whether or not to check riot for update first

    Returns
    -------
    JSON Summoner Model

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        name = request.data.get("name", "")
        account_id = request.data.get("account_id", "")
        region = request.data.get("region")
        if name:
            name = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=name, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        else:
            query = None

        if query and query.exists():
            summoner = query.first()
            serializer = SummonerSerializer(summoner)
            data["data"] = serializer.data
        else:
            data["error"] = "No summoner found"
            status_code = 400
    return Response(data, status=status_code)


@api_view(["POST"])
def get_summoners(request, format=None):
    """

    Parameters
    ----------
    account_ids : [ID]
    region : str

    Returns
    -------
    Summoner List

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        account_ids = request.data["account_ids"]
        account_ids = account_ids[:100]
        region = request.data["region"]
        query = Summoner.objects.filter(account_id__in=account_ids, region=region)
        serializer = SummonerSerializer(query, many=True)
        data = {"data": serializer.data}
    return Response(data, status=status_code)


def match_filter(request, account_id=None):
    """Helper function for other views.

    Parameters
    ----------
    request : Request
    account_id : str
        Include this arg to avoid making a database call

    POST Parameters
    ---------------
    with_names : [str]

    Returns
    -------
    Match QuerySet

    """
    region = request.data.get("region", None)
    name = request.data.get("summoner_name", None)
    account_id = request.data.get("account_id", None)
    queue_in = request.data.get("queue_in", [])
    queue = request.data.get("queue", None)
    with_names = request.data.get("with_names", [])
    champion_key = request.data.get("champion_key", None)

    if account_id is None:
        if name:
            simplified = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=simplified, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        summoner_get_time = time.time()
        summoner = query.first()
        summoner_get_time = time.time() - summoner_get_time
        # print(f'Summoner get time in match_filter() : {summoner_get_time}.')
        account_id = summoner.account_id

    matches = Match.objects.filter(participants__current_account_id=account_id)
    if queue_in:
        matches = matches.filter(queue_id__in=queue_in)
    if queue:
        matches = matches.filter(queue_id=queue)
    if champion_key is not None:
        matches = matches.filter(
            participants__current_account_id=account_id,
            participants__champion_id=champion_key,
        )

    # get matches with common players
    if with_names:
        with_names_simplified = [
            pt.simplify(name) for name in with_names if len(name.strip()) > 0
        ]
        if with_names_simplified:
            matches = matches.filter(
                participants__summoner_name_simplified__in=with_names_simplified
            )
    return matches


def serialize_matches(
    match_query, account_id
):  # pylint: disable=too-many-statements, too-many-branches
    """Precise serializer for a match_query.

    Parameters
    ----------
    match_query : Match QuerySet
    account_id : str

    Returns
    -------
    Serialized Match List

    """
    timer_start = time.time()

    cache_get_time = 0
    cache_set_time = 0

    perk_cache = {}
    perk_tree_cache = {}
    item_cache = {}
    spell_cache = {}

    matches = []
    match_query = match_query.prefetch_related(
        "participants", "teams", "participants__stats"
    )
    for match in match_query:
        # match_serializer = MatchSerializer(match)
        cache_key = f"account/{account_id}/match/{match._id}"

        cache_get_time_temp = time.time()
        cached = cache.get(cache_key)
        cache_get_time_temp = time.time() - cache_get_time_temp
        cache_get_time += cache_get_time_temp

        if cached:
            matches.append(cached)
        else:
            match_data = {
                "id": match.id,
                "_id": match._id,
                "game_duration": match.game_duration,
                "game_creation": match.game_creation,
                "queue_id": match.queue_id,
                "major": match.major,
                "minor": match.minor,
                "tier_average": match.tier_average(),
            }

            participants = []
            part_query = mt.get_sorted_participants(match)
            for participant in part_query:
                # participant_ser = ParticipantSerializer(participant)

                # SPELLS
                if participant.spell_1_id in spell_cache:
                    spell_1 = spell_cache[participant.spell_1_id]
                else:
                    spell_cache[participant.spell_1_id] = {
                        "_id": participant.spell_1_id,
                        "image_url": participant.spell_1_image_url(),
                    }
                    spell_1 = spell_cache[participant.spell_1_id]

                if participant.spell_2_id in spell_cache:
                    spell_2 = spell_cache[participant.spell_2_id]
                else:
                    spell_cache[participant.spell_2_id] = {
                        "_id": participant.spell_2_id,
                        "image_url": participant.spell_2_image_url(),
                    }
                    spell_2 = spell_cache[participant.spell_2_id]

                participant_data = {
                    "_id": participant._id,
                    "summoner_name": participant.summoner_name,
                    "current_account_id": participant.current_account_id,
                    "account_id": participant.account_id,
                    "summoner_id": participant.summoner_id,
                    "lane": participant.lane,
                    "role": participant.role,
                    "team_id": participant.team_id,
                    "spell_1_id": participant.spell_1_id,
                    "spell_1_image_url": spell_1["image_url"],
                    "spell_2_id": participant.spell_2_id,
                    "spell_2_image_url": spell_2["image_url"],
                }

                champ_query = Champion.objects.filter(
                    key=participant.champion_id, language="en_US"
                ).order_by("-version")
                if champ_query.exists():
                    champ = champ_query.first()
                    participant_data["champion"] = {
                        "_id": champ._id,
                        "image_url": champ.image_url(),
                        "name": champ.name,
                    }
                else:
                    participant_data["champion"] = {}

                participant_data["stats"] = {}
                # only add stats if it's for the current summoner
                if participant.current_account_id == account_id:
                    try:
                        stats = participant.stats
                    except:
                        pass
                    else:
                        # ITEM 0
                        if stats.item_0 in item_cache:
                            item_0 = item_cache[stats.item_0]
                        else:
                            item_cache[stats.item_0] = {
                                "_id": stats.item_0,
                                "image_url": stats.item_0_image_url(),
                            }
                            item_0 = item_cache[stats.item_0]

                        # ITEM 1
                        if stats.item_1 in item_cache:
                            item_1 = item_cache[stats.item_1]
                        else:
                            item_cache[stats.item_1] = {
                                "_id": stats.item_1,
                                "image_url": stats.item_1_image_url(),
                            }
                            item_1 = item_cache[stats.item_1]

                        if stats.item_2 in item_cache:
                            item_2 = item_cache[stats.item_2]
                        else:
                            item_cache[stats.item_2] = {
                                "_id": stats.item_2,
                                "image_url": stats.item_2_image_url(),
                            }
                            item_2 = item_cache[stats.item_2]

                        if stats.item_3 in item_cache:
                            item_3 = item_cache[stats.item_3]
                        else:
                            item_cache[stats.item_3] = {
                                "_id": stats.item_3,
                                "image_url": stats.item_3_image_url(),
                            }
                            item_3 = item_cache[stats.item_3]

                        if stats.item_4 in item_cache:
                            item_4 = item_cache[stats.item_4]
                        else:
                            item_cache[stats.item_4] = {
                                "_id": stats.item_4,
                                "image_url": stats.item_4_image_url(),
                            }
                            item_4 = item_cache[stats.item_4]

                        if stats.item_5 in item_cache:
                            item_5 = item_cache[stats.item_5]
                        else:
                            item_cache[stats.item_5] = {
                                "_id": stats.item_5,
                                "image_url": stats.item_5_image_url(),
                            }
                            item_5 = item_cache[stats.item_5]

                        if stats.item_6 in item_cache:
                            item_6 = item_cache[stats.item_6]
                        else:
                            item_cache[stats.item_6] = {
                                "_id": stats.item_6,
                                "image_url": stats.item_6_image_url(),
                            }
                            item_6 = item_cache[stats.item_6]

                        if stats.perk_primary_style in perk_tree_cache:
                            perk_primary_style = perk_tree_cache[
                                stats.perk_primary_style
                            ]
                        else:
                            perk_tree_cache[stats.perk_primary_style] = {
                                "_id": stats.perk_primary_style,
                                "image_url": stats.perk_primary_style_image_url(),
                            }
                            perk_primary_style = perk_tree_cache[
                                stats.perk_primary_style
                            ]

                        if stats.perk_sub_style in perk_tree_cache:
                            perk_sub_style = perk_tree_cache[stats.perk_sub_style]
                        else:
                            perk_tree_cache[stats.perk_sub_style] = {
                                "_id": stats.perk_sub_style,
                                "image_url": stats.perk_sub_style_image_url(),
                            }
                            perk_sub_style = perk_tree_cache[stats.perk_sub_style]

                        if stats.perk_0 in perk_cache:
                            perk_0 = perk_cache[stats.perk_0]
                        else:
                            perk_cache[stats.perk_0] = {
                                "_id": stats.perk_0,
                                "image_url": stats.perk_0_image_url(),
                            }
                            perk_0 = perk_cache[stats.perk_0]

                        stats_data = {
                            "item_0": stats.item_0,
                            "item_0_image_url": item_0["image_url"],
                            "item_1": stats.item_1,
                            "item_1_image_url": item_1["image_url"],
                            "item_2": stats.item_2,
                            "item_2_image_url": item_2["image_url"],
                            "item_3": stats.item_3,
                            "item_3_image_url": item_3["image_url"],
                            "item_4": stats.item_4,
                            "item_4_image_url": item_4["image_url"],
                            "item_5": stats.item_5,
                            "item_5_image_url": item_5["image_url"],
                            "item_6": stats.item_6,
                            "item_6_image_url": item_6["image_url"],
                            "perk_primary_style": stats.perk_primary_style,
                            "perk_primary_style_image_url": perk_primary_style[
                                "image_url"
                            ],
                            "perk_sub_style": stats.perk_sub_style,
                            "perk_sub_style_image_url": perk_sub_style["image_url"],
                            "perk_0": stats.perk_0,
                            "perk_0_image_url": perk_0["image_url"],
                            "perk_0_var_1": stats.perk_0_var_1,
                            "perk_0_var_2": stats.perk_0_var_2,
                            "perk_0_var_3": stats.perk_0_var_3,
                            "kills": stats.kills,
                            "deaths": stats.deaths,
                            "assists": stats.assists,
                            "gold_earned": stats.gold_earned,
                            "champ_level": stats.champ_level,
                            "total_damage_dealt_to_champions": stats.total_damage_dealt_to_champions,
                            "vision_score": stats.vision_score,
                            "vision_wards_bought_in_game": stats.vision_wards_bought_in_game,
                            "wards_placed": stats.wards_placed,
                            "wards_killed": stats.wards_killed,
                            "total_damage_taken": stats.total_damage_taken,
                            "damage_dealt_to_objectives": stats.damage_dealt_to_objectives,
                            "damage_dealt_to_turrets": stats.damage_dealt_to_turrets,
                            "total_minions_killed": stats.total_minions_killed,
                            "neutral_minions_killed": stats.neutral_minions_killed,
                            "total_heal": stats.total_heal,
                            "time_ccing_others": stats.time_ccing_others,
                        }
                        participant_data["stats"] = stats_data
                else:
                    # general data for all participants
                    try:
                        stats = participant.stats
                    except:
                        pass
                    else:
                        stats_data = {
                            "kills": stats.kills,
                            "deaths": stats.deaths,
                            "assists": stats.assists,
                            "champ_level": stats.champ_level,
                            "total_damage_dealt_to_champions": stats.total_damage_dealt_to_champions,
                            "vision_score": stats.vision_score,
                            "total_damage_taken": stats.total_damage_taken,
                            "damage_dealt_to_objectives": stats.damage_dealt_to_objectives,
                            "damage_dealt_to_turrets": stats.damage_dealt_to_turrets,
                            "gold_earned": stats.gold_earned,
                            "total_heal": stats.total_heal,
                            "time_ccing_others": stats.time_ccing_others,
                        }
                        participant_data["stats"] = stats_data
                participants.append(participant_data)

            # SORT PARTICIPANTS SO THAT LANES MATCH UP (imperfect)
            # participants.sort(key=participant_sort)

            match_data["participants"] = participants

            teams = []
            for team in match.teams.all():
                # team_ser = TeamSerializer(team)
                team_data = {
                    "win_str": team.win_str,
                    "_id": team._id,
                }
                # team_data['bans'] = []
                # for ban in team.bans.all():
                #     ban_ser = BanSerializer(ban)
                #     ban_data = ban_ser.data
                #     team_data['bans'].append(ban_data)

                teams.append(team_data)
            match_data["teams"] = teams

            matches.append(match_data)

            cache_set_time_temp = time.time()
            cache.set(cache_key, match_data, None)
            cache_set_time_temp = time.time() - cache_set_time_temp
            cache_set_time += cache_set_time_temp

    # print(f'Cache GET time : {cache_get_time}')
    # print(f'Cache SET time : {cache_set_time}')
    timer_end = time.time()
    if IS_PRINT_TIMERS:
        print(f"Match serialize_matches() took {timer_end - timer_start}.")
    return matches


@api_view(["POST"])
def get_summoner_page(request, format=None):
    """Get the basic information needed to render the summoner page.

    POST Parameters
    ---------------
    id : int
        Internal Summoner ID
    summoner_name : str
    account_id : str
    region : str
    champion_key : int
    update : bool
        Whether or not to check riot for update first
    language : str
        default = 'en_US'
    queue : int
    with_names : [str]
        Get games that include these summoner names.
    page : int
    count : int
    trigger_import : bool
        Whether or not to check for new games
        Even if this is true, it may not check.
    after_index : int
        import matches after this index

    Returns
    -------
    JSON Summoner Page Data

    """
    timer_start = time.time()
    data = {}
    status_code = 200

    if request.method == "POST":
        _id = request.data.get("id", None)
        update = request.data.get("update", False)
        region = request.data.get("region", None)
        name = request.data.get("summoner_name", None)
        account_id = request.data.get("account_id", None)
        language = request.data.get("language", "en_US")
        champion_key = request.data.get("champion_key", None)
        queue = request.data.get("queue", None)
        page = int(request.data.get("page", 1))
        count = int(request.data.get("count", 20))
        order_by = request.data.get("order_by", "-game_creation")
        trigger_import = request.data.get("trigger_import", False)
        after_index = request.data.get("after_index", None)
        if count > 100:
            count = 100

        if name:
            simplified = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=simplified, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        elif _id:
            query = Summoner.objects.filter(id=_id, region=region)

        summoner_time = time.time()
        if query.exists():
            summoner = query.first()
        else:
            # only update if we're not importing for the first time
            update = False
            try:
                r = pt.import_summoner(region, name=name)
            except Exception as error:
                print(error)
                data = {"message": "The summoner could not be found."}
                status_code = 404
                summoner = None
            else:
                simplified = pt.simplify(name)
                query = Summoner.objects.filter(simple_name=simplified, region=region)
                if query.exists():
                    summoner = query.first()
                else:
                    summoner = None
                    data = {
                        "error": "Could not find a summoner in this region with that name."
                    }
                    status_code = 404
        summoner_time = time.time() - summoner_time
        # print(f'Took {summoner_time} to get summoner.')

        if update:
            # enable delay when celery is working
            # pt.import_summoner.delay(region, name=name)
            summoner__id = pt.import_summoner(region, name=name)
            summoner = Summoner.objects.get(id=summoner__id)

        if summoner:
            # summoner_ser = SummonerSerializer(summoner)
            summoner_data = {
                "_id": summoner._id,
                "id": summoner.id,
                "account_id": summoner.account_id,
                "name": summoner.name,
                "simple_name": summoner.simple_name,
                "profile_icon_id": summoner.profile_icon_id,
                "summoner_level": summoner.summoner_level,
            }

            rankcheckpoint = summoner.get_newest_rank_checkpoint()
            if rankcheckpoint:
                rank_positions = RankPositionSerializer(
                    rankcheckpoint.positions.all(), many=True
                ).data
                rank_positions = sort_positions(rank_positions)
            else:
                rank_positions = []

            query = ProfileIcon.objects.filter(_id=summoner.profile_icon_id)
            if query.exists():
                query = query.order_by("-version")
                profile_icon = query.first()
                profile_icon_ser = ProfileIconSerializer(profile_icon)
                profile_icon_data = profile_icon_ser.data
            else:
                profile_icon_data = {}

            # check for new games
            import_time = time.time()
            if trigger_import:
                kwargs = {}
                start_index = 0
                if champion_key is not None:
                    kwargs["champion"] = champion_key
                if queue is not None:
                    kwargs["queue"] = queue
                if after_index is not None:
                    start_index = after_index
                elif page is not None:
                    start_index = (page - 1) * count
                end_index = start_index + count

                timer_matches_import = time.time()
                mt.import_recent_matches(
                    start_index, end_index, summoner.account_id, region, **kwargs
                )
                mt.import_recent_matches.delay(
                    0, 100, summoner.account_id, region,
                )
                if IS_PRINT_TIMERS:
                    print(
                        f"mt.import_recent_matches() took {time.time() - timer_matches_import}."
                    )

                if queue is None and after_index in [None, 0]:
                    summoner.last_summoner_page_import = timezone.now()
                    summoner.save()
            import_time = time.time() - import_time
            # print(f'Match import time took {import_time}.')

            match_query = match_filter(request, account_id=summoner.account_id)
            # match_count = match_query.count()

            start = (page - 1) * count
            end = page * count
            match_query = match_query.order_by(order_by)

            match_query_time = time.time()
            match_query = match_query[start:end]
            match_query_time = time.time() - match_query_time
            # print(f'Match query time : {match_query_time}.')

            match_serialize_time = time.time()
            matches = serialize_matches(match_query, summoner.account_id)
            match_serialize_time = time.time() - match_serialize_time
            # print(f'Match serialize time : {match_serialize_time}')

            data = {
                "matches": matches,
                # 'match_count': match_count,
                "profile_icon": profile_icon_data,
                "summoner": summoner_data,
                "positions": rank_positions,
            }

    timer_end = time.time()
    if IS_PRINT_TIMERS:
        print(f"get_summoner_page() took {timer_end - timer_start}.")
    return Response(data, status=status_code)


def participant_sort(part):
    """assign values to roles to help sorting

    Parameters
    ----------
    part : dict

    Returns
    -------
    int

    """
    out = 0
    if part["lane"] == "TOP":
        out = 0
    elif part["lane"] == "JUNGLE":
        out = 5
    elif part["lane"] == "MIDDLE":
        out = 10
    elif part["lane"] == "BOTTOM":
        if part["role"] == "DUO_CARRY":
            out = 15
        elif part["role"] == "DUO_SUPPORT":
            out = 16
        else:
            out = 15
    return out


@api_view(["POST"])
def get_positions(request, format=None):
    """Get a player's positional ranks.

    Parameters
    ----------
    summoner_id : str
    region : str
    update : bool [true by default]
        Whether or not to try to create a new RankCheckpoint

    Returns
    -------
    JSON Riot Response Data

    """
    data = {}
    status_code = 200
    summoner_id = request.data["summoner_id"]
    region = request.data["region"]
    summoner = Summoner.objects.get(_id=summoner_id, region=region)
    if request.data.get("update", True) is True:
        pt.import_positions(summoner.id)

    summoner.refresh_from_db()
    rankcheckpoint = summoner.get_newest_rank_checkpoint()
    if rankcheckpoint:
        try:
            positions = rankcheckpoint.positions.all()
            pos_data = RankPositionSerializer(positions, many=True).data
            # pos_data.sort(key=lambda x: (tier_sort(x), rank_sort(x), lp_sort(x)))
            pos_data = sort_positions(pos_data)
            data = {"data": pos_data}
            status_code = 200
        except Exception as error:
            print(error)
            data = {"data": []}
            status_code = 200
    else:
        data = {"data": []}
        status_code = 200

    return Response(data, status=status_code)


@api_view(["POST"])
def sign_up(request, format=None):
    """Create an account.

    POST Parameters
    ---------------
    email : str
    password : str

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        if request.user.is_authenticated:
            data = {"message": "You are already logged in."}
            status_code = 403
        else:
            email = request.data.get("email")
            password = request.data.get("password")

            user = pt.create_account(email, password)
            if user:
                data = {"message": "Account created."}
            else:
                if User.objects.filter(email__iexact=email):
                    data = {
                        "message": "The email given already exists.  Try logging in."
                    }
                else:
                    data = {"message": "The email or password was invalid."}
                status_code = 403
    else:
        data = {"message": "This resource only supports POSTs."}

    return Response(data, status=status_code)


@api_view(["POST"])
def verify_email(request, format=None):
    """Verify a User's email.

    * Also calls player.tasks.remove_old_email_verification to delete
        old EmailVerification models.

    POST Parameters
    ---------------
    code : str
        uuid string

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200
    age_hours = 1

    if request.method == "POST":
        code = request.data.get("code")
        verified = pt.verify_user_email(code, age_hours=age_hours)
        if verified:
            data = {"message": "Successfully verified email."}
        else:
            data = {
                "message": (
                    "Either the code does not exist, or it is ",
                    "too old.  Request a new verification email.",
                )
            }
            status_code = 404
        pt.remove_old_email_verification(age_hours=age_hours)
    else:
        data = {"message": "This resource on supports POSTs."}

    return Response(data, status=status_code)


@api_view(["POST"])
def get_summoner_champions_overview(request, format=None):
    """Get overview stats for summoner champions.

    POST Parameters
    ---------------
    summoner_id : ID  
        Internal DB ID
    major_version : int  
    minor_version : int  
    season : int  
    queue_in : list  
        `Ex: [420, 410]`  
    order_by : str  
    start_datetime : ISO Datetime
    end_datetime : ISO Datetime
    start : int  
    end : int  
    fields : list[str]
        leave empty to return all fields
    
    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        start = int(request.data.get("start", 0))
        end = int(request.data.get("end", 5))
        order_by = request.data.get("order_by", None)
        kwargs = {
            "summoner_id": request.data.get("summoner_id", None),
            "major_version": request.data.get("major_version", None),
            "minor_version": request.data.get("minor_version", None),
            "season": request.data.get("season", None),
            "queue_in": request.data.get("queue_in", None),
            "start_datetime": request.data.get("start_datetime", None),
            "end_datetime": request.data.get("end_datetime", None),
            "fields": request.data.get("fields", []),
        }
        query = player_filters.get_summoner_champions_overview(**kwargs)
        if order_by is not None:
            query = query.order_by(order_by)
        count = query.count()
        query = query[start:end]
        data = {"data": query, "count": count}
    else:
        data = {"message": "Must use POST for this resource."}

    return Response(data, status=status_code)


@api_view(["POST"])
def summoner_search(request, format=None):
    """

    POST Parameters
    ---------------
    simple_name__icontains : str
    region : str
    start : int
    end : int
    order_by : str
    fields : list[str]

    Returns
    -------
    JSON Response

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        simple_name__icontains = request.data.get("simple_name__icontains", None)
        simple_name = request.data.get("simple_name", None)
        region = request.data.get("region", None)
        start = int(request.data.get("start", 0))
        end = int(request.data.get("end", 10))
        order_by = request.data.get("order_by", None)
        if end - start > 100:
            end = start + 100
        fields = request.data.get("fields", None)

        kwargs = {
            "simple_name__icontains": simple_name__icontains,
            "simple_name": simple_name,
            "region": region,
            "order_by": order_by,
        }
        query = player_filters.summoner_search(**kwargs)
        query = query[start:end]
        serialized = SummonerSerializer(query, many=True, fields=fields).data
        data = {"data": serialized}

    return Response(data, status=status_code)


@api_view(["POST"])
def is_logged_in(request, format=None):
    """Check if a user is logged in.

    Returns
    -------
    JSON Response

    """
    status_code = 200
    is_authenticated = request.user.is_authenticated
    data = {"data": {"is_logged_in": is_authenticated}}
    return Response(data, status=status_code)


@api_view(["POST"])
def get_rank_history(request, format=None):
    """Get a history of a player's rank.

    POST Parameters
    ---------------
    id : int
        The ID of the summoner.  (internal ID)
    group_by : str
        enum('day', 'month', 'week')
        No grouping, if not provided
    queue : str
        enum('RANKED_SOLO_5x5', '')
    start : ISO Date
    end : ISO Date

    Returns
    -------
    JSON Response

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        summoner_id = request.data.get("id")
        group_by = request.data.get("group_by", None)
        queue = request.data["queue"]
        start = request.data.get("start", None)
        end = request.data.get("end", None)

        query = RankPosition.objects.filter(
            checkpoint__summoner__id=summoner_id, queue_type=queue
        )
        if start is not None:
            query = query.filter(created_date__gte=start)
        if end is not None:
            query = query.filter(created_date__lte=end)

        if group_by is not None:
            query = query.annotate(
                day=Extract("checkpoint__created_date", "day"),
                month=Extract("checkpoint__created_date", "month"),
                year=Extract("checkpoint__created_date", "year"),
                week=Extract("checkpoint__created_date", "week"),
            )
            if group_by == "day":
                query = query.values("day", "month", "year", "week")
                query = query.annotate(
                    peak_rank_integer=Max("rank_integer"),
                    trough_rank_integer=Min("rank_integer"),
                )
                query = query.order_by("year", "month", "day")
            elif group_by == "week":
                query = query.values("month", "year", "week")
                query = query.annotate(
                    peak_rank_integer=Max("rank_integer"),
                    trough_rank_integer=Min("rank_integer"),
                )
                query = query.order_by("year", "month", "week")

            query = query.annotate(start_date=Min("checkpoint__created_date"))
            for elt in query:
                elt["peak_rank"] = decode_int_to_rank(elt["peak_rank_integer"])
                elt["trough_rank"] = decode_int_to_rank(elt["trough_rank_integer"])
            data["data"] = query
        else:
            pass

    return Response(data, status=status_code)


@api_view(["GET", "POST"])
def favorites(request, format=None):
    """

    POST Parameters
    ---------------
    verb : enum('set', 'remove', 'order')
    
    set OR remove
        summoner_id : ID
            internal ID of the summoner that you want to follow

    order
        favorite_ids : [favorite_id, ...]
            List of ordered ID's

    Returns
    -------
    Favorites serialized

    """
    data = {}
    status_code = 200
    user = request.user
    favorite = user.favorite_set.all()

    if request.method == "GET":
        favorite = favorite.order_by("sort_int")
        serialized = FavoriteSerializer(favorite, many=True).data
        data["data"] = serialized
    elif request.method == "POST":
        verb = request.data.get("verb")
        if verb == "set":
            summoner_id = request.data.get("summoner_id")
            summoner = Summoner.objects.get(id=summoner_id)
            if favorite.filter(summoner=summoner).exists():
                # already exists
                data[
                    "message"
                ] = "The summoner selected is already being followed.  No changes made."
            else:
                favorite_model = Favorite(user=user, summoner=summoner)
                favorite_model.save()
                data["message"] = "Successfully saved favorite model."
        elif verb == "remove":
            summoner_id = request.data.get("summoner_id")
            summoner = Summoner.objects.get(id=summoner_id)
            if favorite.filter(summoner=summoner).exists():
                favorite_model = favorite.get(summoner=summoner)
                favorite_model.delete()
                data["message"] = "The summoner was removed from your follow list."
            else:
                data["message"] = "The summoner isn't being followed.  No action taken."
        elif verb == "order":
            id_list = request.data.get("favorite_ids")
            for i, _id in enumerate(id_list):
                if favorite.filter(id=_id).exists():
                    favorite_model = favorite.get(id=_id)
                    favorite_model.sort_int = i
                    favorite_model.save()
            data["message"] = "Saved ordering."

        favorite = user.favorite_set.all()
        favorite = favorite.order_by("sort_int")
        serialized = FavoriteSerializer(favorite, many=True).data
        data["data"] = serialized

    return Response(data, status=status_code)


@api_view(["POST"])
def generate_code(request, format=None):
    """Generate code for connecting summoner account.

    POST Parameters
    ---------------
    action: str
        enum(create, get)

    Returns
    -------
    UUID - Truncated

    """
    status_code = 200
    data = {}

    if request.method == "POST":
        if request.user.is_authenticated:
            action = request.data.get("action", "get")
            if action == "get":
                query = SummonerLink.objects.filter(user=request.user, verified=False)
                if query.exists():
                    link = query.first()
                    now = timezone.now()
                    if now > (link.created_date + timezone.timedelta(hours=2)):
                        link.delete()
                        data = {"message": "Old link.  Please create a new link."}
                        status_code = 400
                    else:
                        data = {"uuid": link.uuid}
                else:
                    data = {"message": "No SummonerLink found for this user."}
                    status_code = 404
            elif action == "create":
                user = request.user

                query = SummonerLink.objects.filter(user=user, verified=False)
                if query.exists():
                    link = query.first()
                    link.delete()
                link = SummonerLink(user=user)
                link.save()
                link.refresh_from_db()
                data = {"uuid": link.uuid}
            else:
                data = {"message": 'action must be "create" or "get".'}
                status_code = 400
        else:
            data = {"message": "User must be logged in."}
            status_code = 403
    else:
        data = {"message": "This endpoint only allows POSTs."}
        status_code = 400
    return Response(data, status=status_code)


@api_view(["POST"])
def connect_account(request, format=None):
    """Attempt to connect a User to a LoL Summoner

    POST Parameters
    ---------------
    summoner_name : str
    region : str

    Returns
    -------
    success or fail message

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        name = request.data["summoner_name"]
        region = request.data["region"]
        api = get_riot_api()

        try:
            _id = pt.import_summoner(region, name=name)
        except:
            # COULDN'T IMPORT SUMMONER
            data = {
                "success": False,
                "message": "Could not find a summoner with the name given.",
            }
        else:
            # SUMMONER FOUND AND IMPORTED
            query = Summoner.objects.filter(id=_id)
            if query.exists():
                summoner = query.first()

                r = api.thirdpartycode.get(summoner._id, region=summoner.region)

                client_code = r.text.strip('"')

                query = SummonerLink.objects.filter(
                    user=request.user, summoner=summoner, verified=True
                )
                if query.exists():
                    # ALREADY CONNECTED
                    data = {
                        "success": False,
                        "message": "This summoner is already linked to this user.",
                    }
                else:
                    # NOT YET CONNECTED
                    query = SummonerLink.objects.filter(
                        user=request.user, verified=False
                    )
                    if query.exists():
                        summonerlink = query.first()
                        if client_code == summonerlink.uuid:
                            summonerlink.verified = True
                            summonerlink.summoner = summoner
                            summonerlink.save()
                            data = {
                                "success": True,
                                "message": "Successfully connected summoner account.",
                            }
                        else:
                            data = {
                                "success": False,
                                "message": "Codes did not match.  Make sure you pasted the code into the client correctly.",
                            }
                    else:
                        # no summonerlink exists
                        data = {
                            "success": False,
                            "message": "Could not find SummonerLink for this user.",
                        }
            else:
                data = {
                    "success": False,
                    "message": "Could not find a Summoner with the given name.",
                }
    else:
        data = {"message": "Only POST requests allowed."}
        status_code = 400
    return Response(data, status=status_code)


@api_view(["POST"])
def get_connected_accounts(request, format=None):
    """Get a list of connected Summoner Accounts.

    Post Parameters
    ---------------
    None

    Returns
    -------
    Summoners

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        id_list = [
            x.summoner.id
            for x in SummonerLink.objects.filter(user=request.user, verified=True)
        ]
        query = Summoner.objects.filter(id__in=id_list)
        serialized = SummonerSerializer(query, many=True).data
        data = {"data": serialized}
    else:
        pass
    return Response(data, status=status_code)


@api_view(["POST"])
def change_password(request, format=None):
    """Request a password change

    POST Parameters
    ---------------
    current_password
    new_password

    Returns
    -------
    bool

    """
    data = {}
    status_code = 200

    if request.method == "POST":
        password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        new_password, is_valid, validators = validate_password(new_password)

        if request.user.is_authenticated:
            is_pass_correct = request.user.check_password(password)
            if is_pass_correct:
                # good
                if is_valid:
                    request.user.set_password(new_password)
                    request.user.save()
                    data = {"data": True, "message": "Successfully set new password."}
                else:
                    data = {"data": False, "message": "The new password was invalid."}
                    status_code = 400
            else:
                data = {"data": False, "message": "The current password was incorrect."}
                status_code = 400
        else:
            data = {"data": False, "message": "Must be logged in to use this function."}
            status_code = 400
    return Response(data, status=status_code)


@api_view(["POST"])
def get_top_played_with(request, format=None):
    """

    Parameters
    ----------
    summoner_id : internal ID for Summoner
    account_id : RIOT account ID
        If `id` is not provided
    group_by : ['summoner_name', 'account_id']
    season_id : int
    queue_id : int
    recent : int
    recent_days : int
    start : int
    end : int

    Returns
    -------
    list of players

    """
    data = {}
    status_code = 200
    cache_seconds = 60 * 60 * 12

    if request.method == "POST":
        _id = request.data.get("summoner_id", None)
        account_id = request.data.get("account_id", None)
        group_by = request.data.get("group_by", None)
        season_id = request.data.get("season_id", None)
        queue_id = request.data.get("queue_id", None)
        recent = request.data.get("recent", None)
        recent_days = request.data.get("recent_days", None)
        start = int(request.data.get("start", 0))
        end = int(request.data.get("end", 20))

        if end - start > 100:
            end = start + 100

        summoner_id = None
        if _id is not None:
            summoner_id = _id
        elif account_id is not None:
            summoner_id = Summoner.objects.get(account_id=account_id).id
        else:
            data = {"message": "Must provide id or account_id."}
            status_code = 400

        if summoner_id:
            cache_key = f"{summoner_id}/{group_by}/{season_id}/{queue_id}/{recent}/{start}/{end}/{recent_days}"
            cached = cache.get(cache_key)

            if cached:
                data = cached
            else:
                query = mt.get_top_played_with(
                    summoner_id,
                    season_id=season_id,
                    queue_id=queue_id,
                    recent=recent,
                    recent_days=recent_days,
                    group_by=group_by,
                )
                query = query[start:end]
                query = list(query.values(group_by, "wins", "count"))
                data = {"data": query}
                cache.set(cache_key, data, cache_seconds)

    else:
        data = {"message": "Only post allowed.", "status": "INVALID_REQUEST"}
    return Response(data, status=status_code)
