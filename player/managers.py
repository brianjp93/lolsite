from datetime import datetime
from typing import TYPE_CHECKING
from django.db import models
from django.db.models.functions import Cast

from data.models import CDProfileIcon


if TYPE_CHECKING:
    from .models import Summoner  # noqa: F401


class SummonerQuerySet(models.QuerySet["Summoner"]):
    def with_user_notes(self, user):
        from player.models import SummonerNote

        if user.is_authenticated:
            queryset = SummonerNote.objects.filter(user=user)
        else:
            queryset = SummonerNote.objects.none()
        return self.prefetch_related(
            models.Prefetch("summonernote_set", queryset=queryset, to_attr="user_notes")
        )

    def with_profile_icon(self):
        return self.annotate(
            profile_icon=CDProfileIcon.objects.filter(
                ext_id=Cast(models.OuterRef("profile_icon_id"), models.CharField())
            ).values("image_url")[:1]
        )


class SummonerManager(models.Manager["Summoner"]):
    def get_queryset(self):
        return SummonerQuerySet(self.model, using=self._db)

    def filter(self, *args, **kwargs) -> SummonerQuerySet:
        return super().filter(*args, **kwargs)  # type: ignore[return-type]

    def exclude(self, *args, **kwargs) -> SummonerQuerySet:
        return super().exclude(*args, **kwargs)  # type: ignore[return-type]

    def none(self) -> SummonerQuerySet:
        return super().none()  # type: ignore[return-type]

    def get_connected_accounts(self, user):
        from .models import SummonerLink

        id_list = [
            x.summoner.id for x in SummonerLink.objects.filter(user=user, verified=True)
        ]
        return self.get_queryset().filter(id__in=id_list)

    def with_user_notes(self, user):
        return self.get_queryset().with_user_notes(user)

    def get_champion_matchups(
        self,
        summoner: Summoner,
        start_dt: datetime | None = None,
        end_dt: datetime | None = None,
        queue_ids: list[int] | None = None,
    ):
        """Return matchup game/win counts and win fractions, with inclusive date bounds."""
        from match.models import Participant

        participants = Participant.objects.using(self.db).filter(puuid=summoner.puuid)
        if start_dt is not None:
            participants = participants.filter(match__game_creation_dt__gte=start_dt)
        if end_dt is not None:
            participants = participants.filter(match__game_creation_dt__lte=end_dt)
        if queue_ids is not None:
            participants = participants.filter(match__queue_id__in=queue_ids)

        return (
            participants.annotate(
                opponent=models.FilteredRelation(
                    "match__participants",
                    condition=models.Q(
                        match__participants__individual_position=models.F(
                            "individual_position"
                        )
                    )
                    & ~models.Q(match__participants__team_id=models.F("team_id")),
                ),
                player_team=models.FilteredRelation(
                    "match__teams",
                    condition=models.Q(match__teams___id=models.F("team_id")),
                ),
            )
            .filter(opponent__isnull=False, player_team__isnull=False)
            .values(
                "champion_id",
                "individual_position",
                opponent_champion_id=models.F("opponent__champion_id"),
            )
            .annotate(
                game_count=models.Count("pk"),
                win_count=models.Count("pk", filter=models.Q(player_team__win=True)),
                win_percentage=Cast(models.F("win_count"), models.FloatField())
                / models.F("game_count"),
            )
            .order_by("-game_count")
        )
