"""player/filters.py
"""
from data.models import Champion
from player.models import Summoner
from match.models import Match, Participant, Stats

from django.db.models import Sum, Count, F, FloatField
from django.db.models import ExpressionWrapper, Value, Case, When
from django.db.models import Subquery, OuterRef


def get_summoner_champions_overview(
        summoner_id=None,
        major_version=None,
        minor_version=None
    ):
    """Get QuerySet of Champion Stats for a summoner.

    Parameters
    ----------
    summoner_id : ID
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

    query = query.annotate(champion_id=F('participant__champion_id'))
    query = query.values('champion_id')
    query = query.annotate(
        count=Count('champion_id'),
        kills_sum=Sum('kills'),
        deaths_sum=Sum('deaths'),
        assists_sum=Sum('assists')
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