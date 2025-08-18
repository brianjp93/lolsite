from functools import cached_property

from django.db import models
from django.db.models import F, Func
from django.contrib.postgres.fields import ArrayField

from data.models import Champion
from stats.managers import SummonerChampionManager, SummonerChampionQuerySet


class ArrayConstructor(Func):
    function = 'ARRAY'
    template = '%(function)s[%(expressions)s]'


class SummonerChampion(models.Model):
    """Champion stats for a summoner."""

    summoner = models.ForeignKey("player.Summoner", on_delete=models.CASCADE)
    champion_key = models.CharField(max_length=32)
    major = models.PositiveSmallIntegerField()
    minor = models.PositiveSmallIntegerField()
    version = models.GeneratedField(
        expression=ArrayConstructor(F('major'), F('minor')),
        output_field=ArrayField(models.IntegerField(), size=2),
        db_persist=True,
        db_index=True,
    )
    queue = models.IntegerField()

    game_ids = ArrayField(models.CharField(), default=list)
    kills = models.IntegerField(default=0)
    deaths = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    damage_to_champions = models.IntegerField(default=0)
    damage_to_objectives = models.IntegerField(default=0)
    damage_to_turrets = models.IntegerField(default=0)
    damage_taken = models.IntegerField(default=0)
    damage_mitigated = models.IntegerField(default=0)
    vision_score = models.IntegerField(default=0)
    total_seconds = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)

    objects: SummonerChampionManager = SummonerChampionManager()  # type: ignore

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["summoner", "champion_key", "major", "minor", "queue"],
                name="%(app_label)s_%(class)s_summoner_champion_version_unique",
            )
        ]

    def __str__(self):
        return f"{self.summoner}"

    @cached_property
    def champion(self):
        return (
            Champion.objects.filter(key=self.champion_key)
            .order_by("-major", "minor")
            .first()
        )


class SummonerChampionAgainst(models.Model):
    """Specific matchup stats per summoner."""

    summoner_champion = models.ForeignKey(SummonerChampion, on_delete=models.CASCADE)
    champion_key = models.CharField(max_length=32)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    game_ids = ArrayField(models.CharField(), default=list)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["summoner_champion", "champion_key"],
                name="%(app_label)s_%(class)s_summoner_champion_champion_unique",
            )
        ]

    @cached_property
    def champion(self):
        return (
            Champion.objects.filter(key=self.champion_key)
            .order_by("-major", "minor")
            .first()
        )
