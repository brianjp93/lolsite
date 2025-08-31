from data import constants as dc
from data.models import Champion
from data.constants import QUEUE_SELECT_OPTIONS, Region
from match.viewsapi import MatchBySummoner
from player.models import Summoner, simplify
from match.models import Participant, Stats

from django.db.models import Exists, Sum, Count, F, FloatField
from django.db.models import ExpressionWrapper, Value, Case, When
from django.db.models import Subquery, OuterRef
from django.db.models import IntegerField, Q

from django.utils.dateparse import parse_datetime

import django_filters


def get_summoner_champions_overview(
    puuid: str | None = None,
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
    puuid : ID
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
    min_game_time = 60 * 5 * 1000
    query = Stats.objects.select_related("participant", "participant__match").filter(
        participant__match__game_duration__gt=min_game_time
    )

    if puuid is not None:
        query = query.filter(participant__puuid=puuid)
    if champion_in is not None:
        query = query.filter(participant__champion_id__in=champion_in)
    if major_version is not None:
        query = query.filter(participant__match__major=major_version)
    if minor_version is not None:
        query = query.filter(participant__match__minor=minor_version)
    if queue_in:
        if not isinstance(queue_in, list):
            queue_in = [queue_in]
        query = query.filter(participant__match__queue_id__in=queue_in)
    if start_datetime is not None:
        start_dt = parse_datetime(start_datetime)
        assert start_dt
        start_timestamp = start_dt.timestamp() * 1000
        query = query.filter(participant__match__game_creation__gt=start_timestamp)
    if end_datetime is not None:
        end_dt = parse_datetime(end_datetime)
        assert end_dt
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
            Sum("participant__match__game_duration") / 60 / 1000,
            output_field=FloatField(),
        )
    if annotation_kwargs:
        query = query.annotate(**annotation_kwargs)

    annotation_kwargs = {}
    if all_fields or "kda" in fields:
        annotation_kwargs["kda"] = ExpressionWrapper(
            ExpressionWrapper(
                F("kills_sum") + F("assists_sum"), output_field=FloatField()
            )
            / Case(
                When(deaths_sum=0.0, then=Value(1.0)),
                default=F("deaths_sum"),
                output_field=FloatField(),
            ),
            output_field=FloatField(),
        )
    if all_fields or "cspm" in fields:
        annotation_kwargs["cspm"] = ExpressionWrapper(
            (
                Sum(
                    F("total_minions_killed") + F("neutral_minions_killed"),
                    output_field=FloatField(),
                )
            )
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
            / Case(
                When(deaths_sum=0, then=Value(1.0)),
                default=F("deaths_sum"),
                output_field=FloatField(),
            ),
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


class SummonerMatchFilter(django_filters.FilterSet):
    played_with = django_filters.CharFilter(
        method="played_with_filter", label="Played With"
    )
    queue = django_filters.ChoiceFilter(
        choices=[(x["_id"], x["description"]) for x in QUEUE_SELECT_OPTIONS],
        empty_label="Any",
        label="Queue",
        method="queue_filter",
    )
    champion = django_filters.ChoiceFilter(
        choices=[],
        empty_label="Any",
        label="Champion",
        method="champion_filter",
        help_text="This will only filter games already imported into our database. It will not contact Riot's API beforehand.",
    )

    def __init__(self, *args, **kwargs):
        self.puuid = kwargs.pop("puuid")
        super().__init__(*args, **kwargs)
        champ = (
            Champion.objects.order_by("-major", "-minor", "-patch")
            .values("major", "minor", "patch")
            .first()
        )
        assert champ
        self.form.fields["champion"].choices = [  # type: ignore
            (x.key, x.name)
            for x in Champion.objects.filter(
                major=champ["major"], minor=champ["minor"], patch=champ["patch"]
            ).order_by("name")
        ]

    @property
    def qs(self):
        qs = super().qs
        qs = qs.filter(participants__puuid=self.puuid)
        return qs

    def champion_filter(self, queryset, _, value):
        if value:
            queryset = queryset.filter(
                Exists(
                    Participant.objects.filter(
                        puuid=self.puuid, champion_id=value, match=OuterRef("id")
                    )
                )
            )
        return queryset

    def played_with_filter(self, queryset, _, value):
        names = value.split(",")
        return MatchBySummoner.get_played_with(names, queryset)

    def queue_filter(self, qs, _, value):
        if value:
            return qs.filter(queue_id=value)
        return qs


class SummonerAutocompleteFilter(django_filters.FilterSet):
    simple_riot_id = django_filters.CharFilter(
        label="Riot ID + Tagline",
        method="simple_riot_id_filter",
        min_length=1,
        required=True,
    )
    region = django_filters.ChoiceFilter(
        choices=[(x, x) for x in Region], initial="na", empty_label=None
    )

    class Meta:
        model = Summoner
        fields = ["simple_riot_id", "region"]

    def simple_riot_id_filter(self, queryset, _, value):
        name = simplify(value)
        return queryset.filter(simple_riot_id__startswith=name)
