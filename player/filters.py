"""player/filters.py
"""
from data import constants as dc
from data.models import Champion
from player.models import Summoner, SummonerLink
from match.models import Stats

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
    fields=[],
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
    fields : list[str]

    Returns
    -------
    QuerySet

    """
    all_fields = True if not fields else False
    min_game_time = 60 * 5
    query = Stats.objects.select_related(
        'participant', 'participant__match'
    ).filter(participant__match__game_duration__gt=min_game_time)

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
        season_start = dc.SEASON_PATCHES[season]["season"]["start"]
        season_end = dc.SEASON_PATCHES[season]["season"]["end"]
        q = Q(
            participant__match__major=season_start[0],
            participant__match__minor__gte=season_start[1],
        )
        q |= Q(
            participant__match__major=season_end[0],
            participant__match__minor__lte=season_end[1],
        )
        query = query.filter(q)

    query = query.annotate(
        champion_id=F("participant__champion_id"),
        win_true=Case(
            When(win=True, then=Value(1)), default=Value(0), output_field=IntegerField()
        ),
        loss_true=Case(
            When(win=False, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        ),
    )
    query = query.values("champion_id")
    query = query.annotate(count=Count("champion_id"))

    annotation_kwargs = {}
    if all_fields or any(field in fields for field in ["kda", "kills_sum"]):
        annotation_kwargs["kills_sum"] = Sum("kills")
    if all_fields or any(field in fields for field in ["kda", "deaths_sum", "dtpd"]):
        annotation_kwargs["deaths_sum"] = Sum("deaths")
    if all_fields or any(field in fields for field in ["kda", "assists_sum"]):
        annotation_kwargs["assists_sum"] = Sum("assists")
    if all_fields or any(
        field in fields for field in ["damage_dealt_to_turrets_sum", "turret_dpm"]
    ):
        annotation_kwargs["damage_dealt_to_turrets_sum"] = Sum(
            "damage_dealt_to_turrets"
        )
    if all_fields or any(
        field in fields for field in ["damage_dealt_to_objectives_sum", "objective_dpm"]
    ):
        annotation_kwargs["damage_dealt_to_objectives_sum"] = Sum(
            "damage_dealt_to_objectives"
        )
    if all_fields or any(
        field in fields for field in ["total_damage_dealt_to_champions_sum", "dpm"]
    ):
        annotation_kwargs["total_damage_dealt_to_champions_sum"] = Sum(
            "total_damage_dealt_to_champions"
        )
    if all_fields or any(
        field in fields for field in ["total_damage_taken_sum", "dtpm", "dtpd"]
    ):
        annotation_kwargs["total_damage_taken_sum"] = Sum("total_damage_taken")
    if all_fields or any(field in fields for field in ["gold_earned_sum", "gpm"]):
        annotation_kwargs["gold_earned_sum"] = Sum("gold_earned")
    if all_fields or any(field in fields for field in ["wins"]):
        annotation_kwargs["wins"] = Sum("win_true")
    if all_fields or any(field in fields for field in ["losses"]):
        annotation_kwargs["losses"] = Sum("loss_true")
    if all_fields or any(
        field in fields
        for field in [
            "minutes",
            "gpm",
            "dpm",
            "dtpm",
            "turret_dpm",
            "objective_dpm",
            "vspm",
            "cspm",
        ]
    ):
        annotation_kwargs["minutes"] = ExpressionWrapper(
            Sum("participant__match__game_duration") / 60, output_field=FloatField()
        )
    if annotation_kwargs:
        query = query.annotate(**annotation_kwargs)

    annotation_kwargs = {}
    if all_fields or "kda" in fields:
        annotation_kwargs["kda"] = ExpressionWrapper(
            ExpressionWrapper(
                F("kills_sum") + F("assists_sum"), output_field=FloatField()
            )
            / Case(When(deaths_sum=0.0, then=Value(1.0)), default=F("deaths_sum"), output_field=FloatField()),
            output_field=FloatField(),
        )
    if all_fields or "cspm" in fields:
        annotation_kwargs["cspm"] = ExpressionWrapper(
            (Sum(F("total_minions_killed") + F("neutral_minions_killed"), output_field=FloatField()))
            / F("minutes"),
            output_field=FloatField(),
        )
    if all_fields or "vspm" in fields:
        annotation_kwargs["vspm"] = ExpressionWrapper(
            Sum("vision_score") / F("minutes"), output_field=FloatField()
        )
    if all_fields or "dpm" in fields:
        annotation_kwargs["dpm"] = ExpressionWrapper(
            F("total_damage_dealt_to_champions_sum") / F("minutes"),
            output_field=FloatField(),
        )
    if all_fields or "objective_dpm" in fields:
        annotation_kwargs["objective_dpm"] = ExpressionWrapper(
            F("damage_dealt_to_objectives_sum") / F("minutes"),
            output_field=FloatField(),
        )
    if all_fields or "turret_dpm" in fields:
        annotation_kwargs["turret_dpm"] = ExpressionWrapper(
            F("damage_dealt_to_turrets_sum") / F("minutes"), output_field=FloatField()
        )
    if all_fields or "dtpm" in fields:
        annotation_kwargs["dtpm"] = ExpressionWrapper(
            F("total_damage_taken_sum") / F("minutes"), output_field=FloatField()
        )
    if all_fields or "dtpd" in fields:
        annotation_kwargs["dtpd"] = ExpressionWrapper(
            F("total_damage_taken_sum")
            / Case(When(deaths_sum=0, then=Value(1.0)), default=F("deaths_sum"), output_field=FloatField()),
            output_field=FloatField(),
        )
    if all_fields or "gpm" in fields:
        annotation_kwargs["gpm"] = ExpressionWrapper(
            F("gold_earned_sum") / F("minutes"), output_field=FloatField()
        )
    if annotation_kwargs:
        query = query.annotate(**annotation_kwargs)

    query = query.annotate(
        champion=Subquery(
            Champion.objects.filter(key=OuterRef("champion_id")).values("name")[:1]
        )
    )

    return query


def summoner_search(
    simple_name__icontains=None, simple_name=None, region=None, order_by=None,
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
        query = query.filter(simple_name__contains=simple_name__icontains.lower())
    if simple_name is not None:
        query = query.filter(simple_name=simple_name)
    if region is not None:
        query = query.filter(region=region)
    if order_by is not None:
        query = query.order_by(order_by)
    return query


def get_connected_accounts_query(user):
    """Get a queryset of a user's connected summoners.

    Parameters
    ----------
    user : User

    Return
    ------
    Summoner QuerySet

    """
    id_list = [
        x.summoner.id
        for x in SummonerLink.objects.filter(user=user, verified=True)
    ]
    return Summoner.objects.filter(id__in=id_list)

