from django.db.models import Exists, OuterRef
from django.db import models
from django.contrib.auth.models import AnonymousUser
from django.http import Http404
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.exceptions import NotFound

from lolsite.tasks import get_riot_api
from lolsite.helpers import HtmxMixin, UserType, query_debugger
from data import constants
from match import tasks as mt
from match.parsers.spectate import SpectateModel

from .models import Match, AdvancedTimeline, MatchSummary
from .models import Participant, sort_positions, Ban
from .serializers import FullMatchSerializer, BasicMatchSerializer, MatchSummarySerializer
from .serializers import MatchSerializer, AdvancedTimelineSerializer, BanSerializer

from player.models import Summoner
from django.shortcuts import get_object_or_404
from lolsite.helpers import CustomLimitOffsetPagination

from player import tasks as pt
from player.serializers import RankPositionSerializer

from data.models import Champion
from data.serializers import BasicChampionWithImageSerializer

import logging

logger = logging.getLogger(__name__)


class MatchBySummoner(ListAPIView):
    serializer_class = BasicMatchSerializer
    queryset = Match.objects.all()
    pagination_class = CustomLimitOffsetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        riot_id_name = pt.simplify(self.kwargs['riot_id_name'])
        riot_id_tagline = self.kwargs['riot_id_tagline']
        region = self.kwargs['region']
        queue = self.request.query_params.get('queue', None)
        if isinstance(queue, str) and queue.isdigit():
            queue = int(queue)
        played_with: list[str] = self.request.query_params.get('playedWith', '').split(',')
        sync_import = self.request.query_params.get('sync_import', False)
        assert self.paginator
        paginator: CustomLimitOffsetPagination = self.paginator  # type: ignore
        start: int = paginator.get_offset(self.request)
        limit: int = paginator.get_limit(self.request)  # type: ignore

        summoner = self.get_summoner(riot_id_name, riot_id_tagline, region)

        # only add view if requesting the first page.
        if start == 0:
            summoner.add_view()

        qs = qs.filter(participants__puuid=summoner.puuid)
        if isinstance(queue, int):
            qs = qs.filter(queue_id=queue)

        played_with = [
            pt.simplify(name)
            for name in played_with if len(name.strip()) > 0
        ]
        if played_with:
            sync_import = False
            qs = self.get_played_with(played_with, qs)

        if sync_import in constants.TRUTHY:
            mt.import_recent_matches(
                start,
                start + limit,
                summoner.puuid,
                region,
                queue=queue,  # type: ignore
            )
            mt.bulk_import.s(summoner.puuid, count=40, offset=start + limit).apply_async(countdown=5)  # type: ignore
        qs = qs.order_by('-game_creation')
        return qs

    @staticmethod
    def get_summoner(riot_id_name: str, riot_id_tagline: str, region: str):
        riot_id_name = pt.simplify(riot_id_name)
        full_id = pt.simplify(f"{riot_id_name}#{riot_id_tagline}")
        summoner_query = Summoner.objects.filter(simple_riot_id=full_id, region=region)
        if len(summoner_query) == 0:
            summoner_id = pt.import_summoner(
                riot_id_name=riot_id_name,
                riot_id_tagline=riot_id_tagline,
                region=region,
            )
            summoner = get_object_or_404(Summoner, id=summoner_id)
        elif len(summoner_query) >= 2:
            for summoner in summoner_query:
                pt.import_summoner(region=region, puuid=summoner.puuid)
            summoner = get_object_or_404(Summoner, region=region, simple_riot_id=full_id)
        else:
            # update in the background if we already have the user imported
            pt.import_summoner.s(riot_id_name=riot_id_name, riot_id_tagline=riot_id_tagline, region=region).apply_async(countdown=1)  # type: ignore
            summoner = summoner_query[0]
        return summoner

    @staticmethod
    def get_played_with(names: list[str], qs: models.QuerySet[Match]):
        match = qs.first()
        if not match:
            return qs.none()
        region = match.region
        played_with = [
            pt.simplify(name)
            for name in names if len(name.strip()) > 0
        ][:10]
        summoner_ids = []
        for simple_name in played_with:
            if "#" in simple_name:
                riot_id_name, riot_id_tagline = simple_name.split("#")
                sid = pt.import_summoner(region, riot_id_name=riot_id_name, riot_id_tagline=riot_id_tagline)
            else:
                obj = Summoner.objects.filter(region=region, riot_id_name__iexact=simple_name).first()
                sid = None
                if obj:
                    sid = obj.id
            if sid:
                summoner_ids.append(sid)
        with_summoners = Summoner.objects.filter(id__in=summoner_ids)
        if not with_summoners:
            return qs.none()
        for x in with_summoners:
            qs = qs.filter(Exists(Participant.objects.filter(puuid=x.puuid, match_id=OuterRef('id'))))
        return qs

def user_can_create_match_summary(user: UserType | AnonymousUser):
    if user.is_superuser:
        return True
    return False

class MatchSummaryView(HtmxMixin, RetrieveAPIView):  # type: ignore
    serializer_class = MatchSummarySerializer
    lookup_field = 'match_id'

    def get_object(self):
        _id = self.kwargs[self.lookup_field]
        match = get_object_or_404(Match.objects.all(), _id=_id)
        if matchsummary := getattr(match, 'matchsummary', None):
            return matchsummary
        else:
            if user_can_create_match_summary(self.request.user):
                mt.get_summary_of_match.delay(match._id)  # type: ignore
                obj = get_object_or_404(MatchSummary, match=match)
                return obj
        raise Http404("Game not found.")


class AdvancedTimelineView(RetrieveAPIView):
    serializer_class = AdvancedTimelineSerializer
    queryset = AdvancedTimeline.objects.prefetch_related(
        'frames',
        'frames__participantframes',
        'frames__wardkillevent_set',
        'frames__wardplacedevent_set',
        'frames__levelupevent_set',
        'frames__skilllevelupevent_set',
        'frames__itempurchasedevent_set',
        'frames__itemdestroyedevent_set',
        'frames__itemsoldevent_set',
        'frames__itemundoevent_set',
        'frames__turretplatedestroyedevent_set',
        'frames__elitemonsterkillevent_set',
        'frames__championspecialkillevent_set',
        'frames__buildingkillevent_set',
        'frames__gameendevent_set',
        'frames__championkillevent_set',
        'frames__championkillevent_set__victimdamagereceived_set',
        'frames__championkillevent_set__victimdamagedealt_set',
        'match__participants',
    )
    lookup_field = 'match_id'

    def get_object(self):
        _id = self.kwargs[self.lookup_field]
        match = get_object_or_404(Match.objects.all(), _id=_id)
        assert match.pk
        if not getattr(match, 'advancedtimeline', None):
            mt.import_advanced_timeline(match.pk)

        try:
            return self.get_queryset().get(match_id=match.id)
        except AdvancedTimeline.DoesNotExist:
            return None


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
    queryset = Match.objects.all()
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
    def get_queryset(self):  # type: ignore
        if qs := getattr(self, 'qs', None):
            return qs
        match_id = self.request.query_params.get("match_id")
        match__id = self.request.query_params.get("match__id")
        self.language = self.request.query_params.get("language", "en_US")
        self.apply_ranks = self.request.query_params.get("apply_ranks", False)
        if match_id:
            match_qs = Match.objects.filter(id=match_id)
        else:
            match_qs = Match.objects.filter(_id=match__id)
        self.match_qs = match_qs.prefetch_related("participants", "participants__stats", 'teams__bans', 'teams')
        self.match = get_object_or_404(self.match_qs)

    def get(self, *args, **kwargs):
        self.get_queryset()
        data = {}
        status_code = 200
        if self.apply_ranks:
            mt.apply_player_ranks(self.match, threshold_days=1)

        # I am using the FullMatchSerializer here because it's mostly the participants
        # and it is being cached
        participants = FullMatchSerializer(self.match_qs, many=True).data[0]['participants']
        data = {"data": participants}
        return Response(data, status=status_code)


@api_view(["GET"])
def get_spectate(request, format=None):
    status_code = 200
    puuid = request.query_params["puuid"]
    region = request.query_params["region"]
    api = get_riot_api()
    r = api.spectator.get(puuid, region)
    if r.status_code == 404:
        data = 'not found'
    else:
        parsed = SpectateModel.model_validate_json(r.content)
        mt.import_spectate_from_data(parsed, region)
        summoners = mt.import_summoners_from_spectate(parsed, region)

        for x in summoners.values():
            pt.import_positions(x, threshold_days=3)

        spectate_data = parsed.model_dump()

        # Collect all participant puuids and champion keys
        participant_puuids = [part["puuid"] for part in spectate_data["participants"]]
        champion_keys = [part["championId"] for part in spectate_data["participants"]]

        # Prefetch all summoners with their rank checkpoints and positions
        summoners_with_positions = Summoner.objects.filter(
            region=region,
            puuid__in=participant_puuids
        ).prefetch_related(
            'rankcheckpoints__positions'
        )

        # Create a mapping of puuid to summoner
        summoner_map = {s.puuid: s for s in summoners_with_positions}

        champions = Champion.objects.filter(
            key__in=champion_keys,
            major=Champion.objects.order_by('-major', '-minor').values_list('major', flat=True)[:1],
            minor=Champion.objects.order_by('-major', '-minor').values_list('minor', flat=True)[:1],
        ).select_related('image')

        champion_map = {champion.key: champion for champion in champions}

        # Process participants with prefetched data
        for part in spectate_data["participants"]:
            positions = None
            if summoner := summoner_map.get(part["puuid"]):
                checkpoint = summoner.get_newest_rank_checkpoint()
                if checkpoint:
                    positions = RankPositionSerializer(
                        checkpoint.positions.all(), many=True
                    ).data
                else:
                    positions = []
                positions = sort_positions(positions)
            part["positions"] = positions

            if champion := champion_map.get(part["championId"]):
                part['champion'] = BasicChampionWithImageSerializer(champion).data
            else:
                logger.info(f"Champion not found for: {part['championId']}")

        data = spectate_data

    return Response(data, status=status_code)


@api_view(["GET"])
def check_for_live_game(request, format=None):
    puuid = request.query_params["puuid"]
    region = request.query_params["region"]
    api = get_riot_api()
    r = api.spectator.get(puuid, region)
    if 200 <= r.status_code < 300:
        spectate_model = SpectateModel.model_validate_json(r.content)
        data = spectate_model.model_dump()
    else:
        data = "not found"
    status_code = 200
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
    if not p:
        raise NotFound('Participant not found.')
    match = p.match
    serializer = MatchSerializer(match)
    data = {"data": serializer.data}
    return Response(data)


class MajorPatchView(ListAPIView):
    """Get the last 5 major patches from matches."""

    def get_queryset(self):
        return Match.objects.values('major').distinct().order_by('-major')[:5]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [{'major': item['major'], 'version': f"{item['major']}"} for item in queryset]
        return Response({'results': data})
