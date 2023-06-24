# pylint: disable=W0613, W0622, W0212, bare-except, broad-except
from rest_framework import permissions
from rest_framework.request import HttpRequest, Request, exceptions
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.generics import RetrieveAPIView, CreateAPIView, UpdateAPIView, ListAPIView

from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AnonymousUser, User
from django.db.models.functions import Extract
from django.db.models import Max, Min, F
from django.shortcuts import get_object_or_404

from lolsite.viewsapi import require_login
from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger

from player import tasks as pt
from player import constants as player_constants
from player import filters as player_filters
from player.models import (
    RankPosition, Comment, Favorite,
    SummonerLink, decode_int_to_rank, validate_password,
    Reputation, NameChange,
)

from data.models import ProfileIcon, Champion
from data.serializers import ProfileIconSerializer

from match import tasks as mt
from match.models import Match, sort_positions

from .models import EmailVerification, Summoner
from .serializers import (
    SummonerSerializer, RankPositionSerializer,
    FavoriteSerializer, CommentSerializer,
    ReputationSerializer, UserSerializer,
    NameChangeSerializer,
)

import random
import logging


logger = logging.getLogger(__name__)


@api_view(["POST"])
def get_summoner(request, format=None):
    """

    POST Parameters
    ---------------
    name : str
    puuid : str
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
        puuid = request.data.get("puuid", "")
        region = request.data.get("region")
        if name:
            name = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=name, region=region)
        elif puuid:
            query = Summoner.objects.filter(puuid=puuid, region=region)
        else:
            query = None

        if query:
            summoner = query[0]
            serializer = SummonerSerializer(summoner)
            data["data"] = serializer.data
        else:
            data["error"] = "No summoner found"
            status_code = 400
    return Response(data, status=status_code)


class MyUserView(RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class SummonerByNameView(RetrieveAPIView):
    lookup_field = 'name'
    serializer_class = SummonerSerializer

    def get_object(self):
        name = pt.simplify(self.kwargs[self.lookup_field])
        region = self.kwargs['region']
        try:
            summoner = Summoner.objects.filter(
                simple_name=name,
                region=region,
            ).get()
        except Summoner.DoesNotExist:
            summoner_id = pt.import_summoner(self.kwargs['region'], name=name)
            return get_object_or_404(Summoner, id=summoner_id)
        pt.import_summoner.delay(self.kwargs['region'], name=name)
        return summoner


@api_view(["POST"])
def get_summoners(request, format=None):
    """Get data for summoners for a list of account_ids.

    Parameters
    ----------
    puuids : [ID]
    region : str

    Returns
    -------
    Summoner List

    """
    data = {}
    status_code = 200
    if request.method == "POST":
        puuids = request.data["puuids"]
        puuids = puuids[:100]
        region = request.data["region"]
        query = Summoner.objects.filter(puuid__in=puuids, region=region)
        serializer = SummonerSerializer(query, many=True)
        data = {"data": serializer.data}
    return Response(data, status=status_code)


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
        except Exception:
            logger.exception('Error while trying to serialize rank positions.')
            data = {"data": []}
            status_code = 200
    else:
        data = {"data": []}
        status_code = 200

    return Response(data, status=status_code)


@api_view(["POST"])
def sign_up(request, format=None):
    data = {}
    status_code = 200

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
    age_hours = 24

    code = request.data.get("code")
    verified = pt.verify_user_email(code, age_hours=age_hours)
    if verified:
        data = {"message": "Successfully verified email."}
    else:
        data = {
            "message": (
                "Either the code does not exist, or it is "
                "too old.  Request a new verification email.",
            )
        }
        status_code = 404
    pt.remove_old_email_verification(age_hours=age_hours)
    return Response(data, status=status_code)


@api_view(["GET"])
def get_summoner_champions_overview(request, format=None):
    data = {}
    status_code = 200

    start = int(request.query_params.get("start", 0))
    end = int(request.query_params.get("end", 5))
    order_by = request.query_params.get("order_by", None)
    kwargs = {
        "puuid": request.query_params.get("puuid", None),
        "major_version": request.query_params.get("major_version", None),
        "minor_version": request.query_params.get("minor_version", None),
        "season": request.query_params.get("season", None),
        "queue_in": request.query_params.get("queue_in[]", None),
        "start_datetime": request.query_params.get("start_datetime", None),
        "end_datetime": request.query_params.get("end_datetime", None),
        "fields": request.query_params.get("fields", []),
    }
    query = player_filters.get_summoner_champions_overview(**kwargs)
    if order_by is not None:
        query = query.order_by(order_by)
    count = query.count()
    query = query[start:end]
    data = {"data": query, "count": count}

    return Response(data, status=status_code)


@api_view(["GET"])
def summoner_search(request: Request, format=None):
    """Provide at least 3 character simple_name to take advantage of trigram gin index.

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

    if request.method == "GET":
        simple_name__icontains = request.query_params.get("simple_name__icontains", None)
        simple_name = request.query_params.get("simple_name", None)
        region = request.query_params.get("region", None)
        start = int(request.query_params.get("start", 0))
        end = int(request.query_params.get("end", 10))
        order_by = request.query_params.get("order_by", None)
        if end - start > 100:
            end = start + 100
        fields = request.query_params.get("fields", None)

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
            query = query.filter(checkpoint__created_date__gte=start)
        if end is not None:
            query = query.filter(checkpoint__created_date__lte=end)

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
            flist = []
            for i, puuid in enumerate(id_list):
                if favorite_model := favorite.filter(summoner__puuid=puuid).first():
                    favorite_model.sort_int = i
                    flist.append(favorite_model)
            Favorite.objects.bulk_update(flist, fields=['sort_int'])
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
    region : str
    summoner_name : str

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
                        version = Champion.objects.first().get_newest_version()
                        icon = ProfileIcon.objects.get(
                            _id=link.profile_icon_id, version=version
                        )
                        icon_data = ProfileIconSerializer(icon, many=False).data
                        data = {"uuid": link.uuid, "icon": icon_data}
                else:
                    data = {"message": "No SummonerLink found for this user."}
                    status_code = 404
            elif action == "create":
                user = request.user
                summoner_name = request.data["summoner_name"]
                region = request.data["region"]

                query = SummonerLink.objects.filter(user=user, verified=False)
                if query.exists():
                    link = query.first()
                    link.delete()

                summoner_id = pt.import_summoner(region, name=summoner_name)
                summoner = Summoner.objects.get(id=summoner_id)

                icon_id = None
                for _ in range(100):
                    icon_id = random.choice(player_constants.VERIFY_WITH_ICON)
                    if icon_id != summoner.profile_icon_id:
                        break

                link = SummonerLink(user=user, profile_icon_id=icon_id)
                link.save()
                link.refresh_from_db()

                version = Champion.objects.first().get_newest_version()
                icon = ProfileIcon.objects.get(_id=icon_id, version=version)
                icon_data = ProfileIconSerializer(icon, many=False).data
                data = {"uuid": link.uuid, "icon": icon_data, "summoner_name": summoner.name}
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
def connect_account_with_profile_icon(request, format=None):
    """Attempt to connect a User to a LoL Summoner.

    - uses profile icon id

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

        try:
            _id = pt.import_summoner(region, name=name)
        except Exception:
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
                        if summoner.profile_icon_id == summonerlink.profile_icon_id:
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
                                "message": "The profile icon set on the Summoner was incorrect.",
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


@api_view(["GET"])
def get_connected_accounts(request, format=None):
    data = {}
    status_code = 200
    if request.method == "GET":
        if request.user.is_authenticated:
            query = player_filters.get_connected_accounts_query(request.user)
            serialized = SummonerSerializer(query, many=True).data
        else:
            serialized = []
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
    puuid : RIOT PUUID
        If `id` is not provided
    group_by : ['summoner_name', 'puuid']
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
        puuid = request.data.get("puuid", None)
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
        elif puuid is not None:
            summoner_id = Summoner.objects.get(puuid=puuid).id
        else:
            data = {"message": "Must provide id or puuid."}
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


@api_view(["GET"])
def comment_count(request, format=None):
    """Get comment count for matches.

    Parameters
    ----------
    match_ids : list[int]
        Internal match ID

    Returns
    -------
    JSON
        {data : [{match_id: count}, ...]}

    """
    status_code = 200
    match_ids = request.GET.getlist("match_ids[]")
    query = Match.objects.filter(id__in=match_ids)
    counts = {x.id: x.get_comment_count() for x in query}
    data = {"data": counts}
    return Response(data, status=status_code)


@api_view(["GET", "POST", "PUT", "DELETE"])
def comment(request, format=None):
    """Create, edit, delete, get comments.

    Parameters
    ----------
    Refer to get, delete, create_update

    Returns
    -------
    json

    """
    data = {}
    status_code = 200

    if request.method == "GET":
        data, status_code = get_comment(request)
    elif request.method == "POST":
        data, status_code = create_update_comment(request, "create")
    elif request.method == "PUT":
        data, status_code = create_update_comment(request, "update")
    elif request.method == "DELETE":
        data, status_code = delete_comment(request)
    else:
        data = {"message": "Invalid request method.", "status": "INVALID_REQUEST"}
        status_code = 403
    return Response(data, status=status_code)


def get_comment(request):
    """Get comments by ID or paginated.

    Parameters
    ----------
    comment_id : int
        only supply if you want the replies to a comment
    match_id : int
    start : int
    end : int
    nest : int
        reply nest level
    depth : int
        comments per nest - every comment can have <depth> replies
    order_by : str
        enum('likes', 'created_date')

    Returns
    -------
    (dict, int)
        data, status-code

    """
    data = {}
    status_code = 200
    comment_id = request.GET.get("comment_id")
    match_id = request.GET.get("match_id")
    start = int(request.GET.get("start", 0))
    end = int(request.GET.get("end", 10))
    nest = int(request.GET.get("nest", 2))
    depth = int(request.GET.get("depth", 5))
    order_by = request.GET.get("order_by", "-created_date")
    query = None
    if match_id is not None:
        query = Comment.objects.filter(match=match_id, reply_to=None)
    elif comment_id is not None:
        query = Comment.objects.filter(reply_to=comment_id)
    else:
        # must provide match_id or comment_id
        pass
    if query is not None:
        query = sort_comments(query, order_by)
        count = query.count()
        query = query[start:end]
        comment_data = [
            recursively_serialize_comment(
                comment, nest, depth, order_by, user=request.user
            )
            for comment in query
        ]
        data = {"data": comment_data, "count": count}
    return data, status_code


def serialize_comment(comment, user=None):
    """Serialize a comment"""
    out = CommentSerializer(comment).data
    out["is_liked"] = False
    out["is_disliked"] = False
    out["replies"] = []
    if comment.is_deleted:
        out["markdown"] = ""
    else:
        if user is not None:
            if comment.liked_by.filter(id=user.id).exists():
                out["is_liked"] = True
            if comment.disliked_by.filter(id=user.id).exists():
                out["is_disliked"] = True
    return out


def recursively_serialize_comment(
    comment, nest=0, depth=10, order_by="-created_date", user=None
):
    """Serialize comments and their reples.

    Parameters
    ----------
    comment : Comment
    nest : int
    depth : int
    order_by : str
        enum('likes', 'popularity', 'created_date')

    Returns
    -------
    list(Comment)

    """
    out = serialize_comment(comment, user=user)
    query = comment.replies.all()
    query = sort_comments(query, order_by)
    count = query.count()
    out["replies_count"] = count
    query = query[0:depth]
    if nest >= 1:
        for reply in query:
            out["replies"].append(
                recursively_serialize_comment(
                    reply, nest - 1, depth, order_by, user=user
                )
            )
    return out


def sort_comments(query, order_by):
    """Order comments by some parameter.

    popularity - ordering by popularity is interesting, at first
        I thought I would just do `likes / (likes+dislikes)` but
        this would cause 1 likes comments with a 1.0 like ratio
        to be rated more highly than a comment with 1000 likes and 1 dislike.
        To remedy this, I make the assumption that 1 extra like and dislike
        exist and then make the ratio calculation from there.

    Parameters
    ----------
    query : Comment QuerySet
    order_by : str

    Returns
    -------
    Comment QuerySet

    """
    if order_by in "-popularity":
        query = query.annotate(
            popularity=(F("likes") + 1.0) / (F("likes") + F("dislikes") + 2.0)
        )
    query = query.order_by(order_by)
    return query


def create_update_comment(request, action):
    """Create or update comment.

    Parameters
    ----------
    action : str
        enum('create', 'update')

    request Parameters
    ------------------
    match_id : int
    summoner_id : int
    comment_id : int
    markdown : str
    reply_to : int
        comment id

    Returns
    -------
    Comment JSON

    """
    data = {}
    status_code = 200
    match_id = request.data.get("match_id")
    reply_to = request.data.get("reply_to")
    summoner_id = request.data.get("summoner_id")
    comment_id = request.data.get("comment_id")
    markdown = request.data["markdown"]
    comment = None
    if action == "create":
        summoner = Summoner.objects.get(id=summoner_id)
        if summoner.is_connected_to(request.user.id):
            if reply_to:
                reply_to_comment = Comment.objects.get(id=reply_to)
                comment = Comment(
                    reply_to=reply_to_comment,
                    summoner=summoner,
                    match=reply_to_comment.match,
                )
            elif match_id:
                match = Match.objects.get(id=match_id)
                comment = Comment(match=match, summoner=summoner)
        else:
            data = {
                "message": "Not connected to selected summoner.",
                "status": "INVALID_SUMMONER",
            }
            status_code = 404
    elif action == "update":
        query = Comment.objects.get(comment_id, summoner__user=request.user)
        if query.exists():
            comment = query.first()
    else:
        # invalid action
        pass
    if comment is not None:
        # edit comment as needed
        comment.markdown = markdown
        comment.save()
        data = {
            "data": recursively_serialize_comment(
                comment, nest=1, depth=2, user=request.user
            )
        }
    else:
        # could not find comment
        pass
    return data, status_code


def delete_comment(request):
    """Set is_deleted=True. Doesn't actually delete.

    Parameters
    ----------
    comment_id : int

    Returns
    -------
    json

    """
    data = {}
    status_code = 200

    comment_id = request.data["comment_id"]
    query = Comment.objects.filter(
        id=comment_id, summoner__summonerlinks__user=request.user
    )

    if query.exists():
        comment = query.first()
        comment.is_deleted = True
        comment.save()
        data = {"data": serialize_comment(comment, user=request.user)}
    else:
        data = {"message": "Could not find comment.", "status": "NOT_FOUND"}
        status_code = 404
    return data, status_code


@api_view(["GET"])
def get_replies(request, format=None):
    """Get comment replies.

    Parameters
    ----------
    comment_id : int
    start : int
    end : int
    order_by : str
        enum('likes', 'created_date', 'popularity')
    """
    data = {}
    status_code = 200
    comment_id = request.GET.get("comment_id")
    start = int(request.GET.get("start", 0))
    end = int(request.GET.get("end", 10))
    if end - start > 100:
        end = start + 10
    order_by = request.GET.get("order_by", "-likes")
    query = Comment.objects.filter(id=comment_id)
    if query.exists():
        comment = query.first()
        replies = comment.replies.all().order_by(order_by)
        count = replies.count()
        replies = replies[start:end]
        data = {
            "data": [serialize_comment(reply, user=request.user) for reply in replies],
            "count": count,
        }
    else:
        data = {"message": "comment not found", "status": "NOT_FOUND"}
        status_code = 404
    return Response(data, status=status_code)


@api_view(["PUT"])
@require_login
def like_comment(request, format=None):
    """Like or un-like a comment.

    Parameters
    ----------
    comment_id : int
    like : bool
    order_by : str

    Returns
    -------
    Comment

    """
    data = {}
    status_code = 200
    comment_id = request.data.get("comment_id")
    nest = request.data.get("nest", 1)
    depth = request.data.get("depth", 10)
    like = request.data.get("like", False)
    order_by = request.data.get("order_by", "-popularity")
    comment = Comment.objects.get(id=comment_id)
    comment.disliked_by.remove(request.user)
    if like:
        comment.liked_by.add(request.user)
    else:
        comment.liked_by.remove(request.user)
    comment.likes = comment.liked_by.count()
    comment.dislikes = comment.disliked_by.count()
    comment.save()
    comment.refresh_from_db()
    data = {
        "data": recursively_serialize_comment(
            comment, nest=nest, depth=depth, order_by=order_by, user=request.user
        )
    }
    return Response(data, status=status_code)


@api_view(["PUT"])
@require_login
def dislike_comment(request, format=None):
    """Like or un-like a comment.

    Parameters
    ----------
    comment_id : int
    like : bool
    order_by : str

    Returns
    -------
    Comment

    """
    data = {}
    status_code = 200
    comment_id = request.data.get("comment_id")
    nest = request.data.get("nest", 1)
    depth = request.data.get("depth", 10)
    dislike = request.data.get("dislike", False)
    order_by = request.data.get("order_by", "-popularity")
    comment = Comment.objects.get(id=comment_id)
    comment.liked_by.remove(request.user)
    if dislike:
        comment.disliked_by.add(request.user)
    else:
        comment.disliked_by.remove(request.user)
    comment.likes = comment.liked_by.count()
    comment.dislikes = comment.disliked_by.count()
    comment.save()
    comment.refresh_from_db()
    data = {
        "data": recursively_serialize_comment(
            comment, nest=nest, depth=depth, order_by=order_by, user=request.user
        )
    }
    return Response(data, status=status_code)


@api_view(["POST"])
@require_login
def edit_default_summoner(request, format=None):
    data = {}
    status_code = 200
    summoner_id = request.data['summoner_id']
    if summoner_id is None:
        request.user.custom.default_summoner = None
        request.user.custom.save()
        data = {'status': 'success', 'default_summoner': {}}
    else:
        qs = Summoner.objects.filter(id=summoner_id)
        if qs.exists():
            summoner = qs.first()
            request.user.custom.default_summoner = summoner
            request.user.custom.save()
            data = {'status': 'success', 'default_summoner': SummonerSerializer(summoner).data}
        else:
            status_code = 404
            data = {'status': 'failure', 'message': 'Could not find Summoner with given id.'}
    return Response(data, status=status_code)


class ReputationRetrieveAPIView(RetrieveAPIView):
    serializer_class = ReputationSerializer
    lookup_field = 'summoner_pk'
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        qs = Reputation.objects.filter(
            summoner=self.kwargs[self.lookup_field],
            user=self.request.user,
        )
        return get_object_or_404(qs)


class ReputationCreateView(CreateAPIView):
    serializer_class = ReputationSerializer


class ReputationUpdateView(UpdateAPIView):
    serializer_class = ReputationSerializer

    def get_queryset(self):
        return Reputation.objects.filter(user=self.request.user)


class NameChangeListView(ListAPIView):
    serializer_class = NameChangeSerializer
    lookup_field = 'summoner_pk'

    def get_queryset(self):
        qs = NameChange.objects.filter(summoner=self.kwargs[self.lookup_field])
        qs = qs.order_by('-created_date')
        return qs


@api_view(['POST'])
def login_action(request, format=None):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(request, username=email, password=password)
    if user:
        if user.custom.is_email_verified:
            logger.info(f'Logging in user: {user}')
            login(request, user)
            return Response({'message': 'logged in.'})
        else:
            view_name = "/login?error=verification"
            thresh = timezone.now() - timezone.timedelta(minutes=10)
            query = user.emailverification_set.filter(created_date__gt=thresh)
            if not query.exists():
                # Create new email verification model.
                EmailVerification.objects.create(user=user)
            raise exceptions.PermissionDenied(code='not-verified')
    else:
        raise exceptions.NotAuthenticated()


@api_view(['POST'])
def logout_action(request, format=None):
    user: User | AnonymousUser = request.user
    if user.is_authenticated:
        logout(request)
    return Response('logged out')


@api_view(['GET'])
def is_suspicious_account(request, format=None):
    puuid = request.query_params['puuid']
    summoner = get_object_or_404(Summoner, puuid=puuid)
    sus = summoner.suspicious_account()
    return Response(sus)
