from django.db.models import QuerySet, F
from django.db.models.functions import Greatest, Cast
from django.db import models


class SummonerChampionQuerySet(QuerySet):
    def with_computed_stats(self):
        return self.annotate(
            vspm=F("vision_score")
            / Greatest(
                Cast("total_seconds", models.FloatField()),
                1.0,
                output_field=models.FloatField(),
            )
            * 60.0,
            dpm=F("damage_to_champions")
            / Greatest(Cast("total_seconds", models.FloatField()), 1.0)
            * 60.0,
            game_count=F("wins") + F("losses"),
            win_percentage=(
                Cast("wins", output_field=models.FloatField())
                / Greatest(F("game_count"), 1, output_field=models.FloatField())
            )
            * 100.0,
            kda=(F("kills") + F("assists"))
            / Greatest(Cast("deaths", models.FloatField()), 1.0),
            dtpm=F("damage_taken")
            / Greatest(Cast("total_seconds", models.FloatField()), 1.0)
            * 60.0,
            dttpm=F("damage_to_turrets")
            / Greatest(Cast("total_seconds", models.FloatField()), 1.0)
            * 60.0,
            dtopm=F("damage_to_objectives")
            / Greatest(Cast("total_seconds", models.FloatField()), 1.0)
            * 60.0,
            dmpm=F("damage_mitigated")
            / Greatest(Cast("total_seconds", models.FloatField()), 1.0)
            * 60.0,
        )
