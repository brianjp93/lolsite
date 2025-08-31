from typing import TYPE_CHECKING
from django.db import models

if TYPE_CHECKING:
    from player.models import Summoner


class SummonerQuerySet(models.QuerySet['Summoner']):
    pass


class SummonerManager(models.Manager['Summoner']):
    def get_queryset(self):
        return SummonerQuerySet(self.model, using=self._db)

    def get_connected_accounts(self, user):
        from .models import SummonerLink
        id_list = [
            x.summoner.id for x in SummonerLink.objects.filter(user=user, verified=True)
        ]
        return self.get_queryset().filter(id__in=id_list)
