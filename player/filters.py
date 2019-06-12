"""player/filters.py
"""
from data.models import Champion
from player.models import Summoner
from match.models import Match, Participant, Stats

from django.db.models import Sum, Count, F, FloatField
from django.db.models import ExpressionWrapper, Value, Case, When
from django.db.models import Subquery, OuterRef
from django.db.models import IntegerField


def get_summoner_champions_overview(
        summoner_id=None,
        major_version=None,
        minor_version=None,
        queue_in=None,
    ):
    """Get QuerySet of Champion Stats for a summoner.

    Parameters
    ----------
    summoner_id : ID
    queue_in : list
    major_version : int
    minor_version : int

    Returns
    -------
    QuerySet

    """
    summoner = Summoner.objects.get(id=summoner_id)

    query = Stats.objects.filter(participant__summoner_id=summoner._id)

    if major_version is not None:
        query = query.filter(participant__match__major=major_version)
    if minor_version is not None:
        query = query.filter(participant__match__minor=minor_version)
    if queue_in:
        query = query.filter(participant__match__queue_id__in=queue_in)

    loss_time = 60 * 5
    query = query.annotate(
        champion_id=F('participant__champion_id'),
        win_true=Case(
            When(win=True, then=Value(1)),
            default=Value(0),
            output_field=IntegerField()
        ),
        loss_true=Case(
            When(win=False, participant__match__game_duration__gt=loss_time, then=Value(1)),
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
        )
    )
    query = query.annotate(champion=Subquery(
        Champion.objects.filter(key=OuterRef('champion_id')).values('name')[:1]
    ))

    return query
