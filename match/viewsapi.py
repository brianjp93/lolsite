"""match/viewsapi.py
"""
from celery import group
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView, RetrieveAPIView

from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger
from data import constants
from match import tasks as mt

from .models import Match, AdvancedTimeline
from .models import Participant, sort_positions, Ban
from .serializers import FullMatchSerializer, BasicMatchSerializer
from .serializers import MatchSerializer, AdvancedTimelineSerializer, BanSerializer

from player.models import Summoner
from django.shortcuts import get_object_or_404
from lolsite.helpers import CustomLimitOffsetPagination

from player import tasks as pt
from player.models import simplify
from player.serializers import RankPositionSerializer

from data.models import Champion
from data.serializers import BasicChampionWithImageSerializer

import logging

logger = logging.getLogger(__name__)


class MatchBySummoner(ListAPIView):
    serializer_class = BasicMatchSerializer
    queryset = Match.objects.filter(is_fully_imported=True)
    pagination_class = CustomLimitOffsetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        name = pt.simplify(self.kwargs['name'])
        region = self.kwargs['region']
        queue = self.request.query_params.get('queue', None)
        if isinstance(queue, str) and queue.isdigit():
            queue = int(queue)
        with_names = self.request.query_params.get('with_names', [])
        sync_import = self.request.query_params.get('sync_import', False)
        start: int = self.paginator.get_offset(self.request)
        limit: int = self.paginator.get_limit(self.request)

        summoner_query = Summoner.objects.filter(simple_name=name, region=region)
        if len(summoner_query) == 0:
            summoner_id = pt.import_summoner(region, name=name)
            summoner = get_object_or_404(Summoner, id=summoner_id)
        elif len(summoner_query) >= 2:
            for summoner in summoner_query:
                pt.import_summoner(region, puuid=summoner.puuid)
            summoner = get_object_or_404(Summoner, region=region, simple_name=name)
        else:
            # update in the background if we already have the user imported
            pt.import_summoner.delay(region, name=name)
            summoner = summoner_query[0]

        mt.bulk_import.delay(summoner.puuid)
        qs = qs.filter(
            participants__puuid=summoner.puuid,
            is_fully_imported=True,
        )
        if isinstance(queue, int):
            qs = qs.filter(queue_id=queue)

        with_names = [
            pt.simplify(name)
            for name in with_names if len(name.strip()) > 0
        ]
        if with_names:
            qs = qs.filter(
                participants__summoner_name_simplified__in=with_names
            )

        if sync_import in constants.TRUTHY:
            mt.import_recent_matches(
                start, start + limit, summoner.puuid, region, queue=queue,
            )
        qs = qs.order_by('-game_creation')
        return qs


class AdvancedTimelineView(RetrieveAPIView):
    serializer_class = AdvancedTimelineSerializer
    queryset = AdvancedTimeline.objects.all()
    lookup_field = 'match_id'

    def get_object(self):
        _id = self.kwargs[self.lookup_field]
        match = get_object_or_404(Match.objects.all().select_related('advancedtimeline'), _id=_id)
        if not getattr(match, 'advancedtimeline', None):
            mt.import_advanced_timeline(match.id)
            match.refresh_from_db()
        return getattr(match, 'advancedtimeline', None)


class MatchBanListView(ListAPIView):
    serializer_class = BanSerializer

    def get_queryset(self):
        _id = self.kwargs['_id']
        qs = Ban.objects.filter(team__match___id=_id)
        qs = qs.order_by('pick_turn')
        qs = qs.select_related('team')
        return qs


class MatchView(RetrieveAPIView):
    serializer_class = MatchSerializer
    queryset = Match
    lookup_field = '_id'

    def get_serializer(self, *args, **kwargs):
        match = args[0]
        op_summoners = []
        if self.request.user.is_authenticated:
            op_summoners = [
                x for x in Summoner.objects.filter(summonerlinks__user=self.request.user)
                if x.summonerlinks.get(user=self.request.user).verified is True
            ]
        if part := match.is_summoner_in_game(op_summoners):
            kwargs['summoner_name'] = part.summoner_name_simplified
        return super().get_serializer(*args, **kwargs)


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
            jobs = [pt.import_positions.s(x, threshold_days=3) for x in summoners.values()]
            g = group(*jobs)
            g().get()
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
