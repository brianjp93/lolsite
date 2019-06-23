"""player/filters.py
"""
from data import constants as dc
from data.models import Champion
from player.models import Summoner
from match.models import Match, Participant, Stats

from django.db.models import Sum, Count, F, FloatField
from django.db.models import ExpressionWrapper, Value, Case, When
from django.db.models import Subquery, OuterRef
from django.db.models import IntegerField, Q

from django.utils.dateparse import parse_datetime


def get_summoner_champions_overview(
        summoner_id=None,
        major_version=None,
        minor_version=None,
        queue_in=None,
        season=None,
        champion_in=None,
        start_datetime=None,
        end_datetime=None,
    ):
    """Get QuerySet of Champion Stats for a summoner.

    Parameters
    ----------
    summoner_id : ID
    queue_in : list
    major_version : int
    minor_version : int
    season : int
    champion_in : list[int]
        list of champion keys
    start_datetime : ISO Datetime
    end_datetime : ISO Datetime

    Returns
    -------
    QuerySet

    """
    min_game_time = 60 * 5
    query = Stats.objects.filter(
        participant__match__game_duration__gt=min_game_time
    )

    if summoner_id is not None:
        summoner = Summoner.objects.get(id=summoner_id)
        query = query.filter(participant__summoner_id=summoner._id)
    if champion_in is not None:
        query = query.filter(participant__champion_id__in=champion_in)
    if major_version is not None:
        query = query.filter(participant__match__major=major_version)
    if minor_version is not None:
        query = query.filter(participant__match__minor=minor_version)
    if queue_in:
        query = query.filter(participant__match__queue_id__in=queue_in)
    if start_datetime is not None:
        start_dt = parse_datetime(start_datetime)
        start_timestamp = start_dt.timestamp() * 1000
        query = query.filter(participant__match__game_creation__gt=start_timestamp)
    if end_datetime is not None:
        end_dt = parse_datetime(end_datetime)
        end_timestamp = end_dt.timestamp() * 1000
        query = query.filter(participant__match__game_creation__gt=end_timestamp)
    if season is not None:
        season = int(season)
        season_start = dc.SEASON_PATCHES[season]['season']['start']
        season_end = dc.SEASON_PATCHES[season]['season']['end']
        q = Q(participant__match__major=season_start[0], participant__match__minor__gte=season_start[1])
        q |= (Q(participant__match__major=season_end[0], participant__match__minor__lte=season_end[1]))
        query = query.filter(q)

    query = query.annotate(
        champion_id=F('participant__champion_id'),
        win_true=Case(
            When(win=True, then=Value(1)),
            default=Value(0),
            output_field=IntegerField()
        ),
        loss_true=Case(
            When(win=False, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
    )
    query = query.values('champion_id')
    query = query.annotate(
        count=Count('champion_id'),
        kills_sum=Sum('kills'),
        deaths_sum=Sum('deaths'),
        assists_sum=Sum('assists'),
        wins=Sum('win_true'),
        losses=Sum('loss_true'),
        minutes=ExpressionWrapper(Sum('participant__match__game_duration') / 60.0, output_field=FloatField())
    )
    query = query.annotate(
        kda=ExpressionWrapper(
            ExpressionWrapper(
                F('kills_sum') + F('assists_sum'),
                output_field=FloatField()
            ) / Case(
                When(deaths_sum=0, then=Value(1.0)),
                default=F('deaths_sum')
            ),
            output_field=FloatField()
        ),
        cspm=ExpressionWrapper(
            (Sum('total_minions_killed') + Sum('neutral_minions_killed')) / F('minutes'),
            output_field=FloatField()
        ),
        vspm=ExpressionWrapper(
            Sum('vision_score') / F('minutes'),
            output_field=FloatField()
        )
    )
    query = query.annotate(champion=Subquery(
        Champion.objects.filter(key=OuterRef('champion_id')).values('name')[:1]
    ))

    return query


def summoner_search(
        simple_name__icontains=None,
        simple_name=None,
        region=None,
        order_by=None,
    ):
    """filter for summoners.

    Parameters
    ----------
    simple_name__icontains : str
    simple_name : str
    region : str

    Returns
    -------
    QueryResponse

    """
    query = Summoner.objects.all()

    if simple_name__icontains is not None:
        query = query.filter(simple_name__icontains=simple_name__icontains)
    if simple_name is not None:
        query = query.filter(simple_name=simple_name)
    if region is not None:
        query = query.filter(region=region)
    if order_by is not None:
        query = query.order_by(order_by)
    return query
