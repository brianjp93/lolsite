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
            profile_icon= CDProfileIcon.objects.filter(
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
