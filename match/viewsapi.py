"""match/viewsapi.py
"""
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView

from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger
from match import tasks as mt
from player import tasks as pt

from .models import Match, Participant, sort_positions

from player.models import Summoner, simplify

from data.models import Champion
from data.serializers import BasicChampionWithImageSerializer

from .serializers import (
    MatchSerializer,
    AdvancedTimelineSerializer, FullMatchSerializer,
)

from player.serializers import RankPositionSerializer

from multiprocessing.dummy import Pool as ThreadPool

from django.shortcuts import get_object_or_404


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
    match_id = request.data.get("match_id", None)
    if request.method == "POST":
        match = Match.objects.get(_id=match_id)
        try:
            timeline = match.advancedtimeline
        except:
            mt.import_advanced_timeline(match.id)
            match.refresh_from_db()
            timeline = match.advancedtimeline

        data = {'data': AdvancedTimelineSerializer(timeline).data.get('frames', {})}
    return Response(data, status=status_code)


@api_view(["POST"])
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


class ParticipantsView(ListAPIView):
    """Retrieve participants for a specific game.

    Parameters
    ----------
    `match_id`: int\n
    * internal ID\n
    `match__id`: int\n
    * riot ID\n
    `language`: str\n
    `apply_ranks`: bool\n

    """
    def get_queryset(self):
        if hasattr(self, 'qs'):
            return self.qs
        match_id = self.request.query_params.get("match_id")
        match__id = self.request.query_params.get("match__id")
        self.language = self.request.query_params.get("language", "en_US")
        self.apply_ranks = self.request.query_params.get("apply_ranks", False)
        if match_id:
            match_qs = Match.objects.filter(id=match_id)
        else:
            match_qs = Match.objects.filter(_id=match__id)
        self.match_qs = match_qs
        self.match = get_object_or_404(match_qs)
        self.qs = self.match.participants.all().select_related('stats')
        return self.qs

    def get(self, *args, **kwargs):
        self.get_queryset()
        data = {}
        status_code = 200
        if self.apply_ranks:
            mt.apply_player_ranks(self.match, threshold_days=1)

        # I am using the FullMatchSerializer here because it's mostly the participants
        # and it is being cached
        participants = FullMatchSerializer(self.match).data['participants']
        data = {"data": participants}
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
                    part['champion'] = BasicChampionWithImageSerializer(champion).data

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
