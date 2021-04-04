"""match/viewsapi.py
"""
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView

from lolsite.tasks import get_riot_api
from lolsite.helpers import query_debugger
from match import tasks as mt
from player import tasks as pt

from .models import Match, Participant

from .models import sort_positions

from player.models import Summoner, simplify

from data.models import Champion

from .serializers import MatchSerializer, FullParticipantSerializer

from player.serializers import RankPositionSerializer

from multiprocessing.dummy import Pool as ThreadPool

from django.core.cache import cache
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
        participants = FullParticipantSerializer(self.qs, many=True).data
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
                    part["champion"] = {
                        "name": champion.name,
                        "image_url": champion.image_url(),
                        "thumbs": champion.image.thumbs(),
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
