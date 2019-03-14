from django.db import models
from django.utils import timezone

from match.models import Participant


def simplify(name):
    """Return the lowercase, no space version of a string.

    Parameters
    ----------
    name : str

    Returns
    -------
    str

    """
    return ''.join(name.split()).lower()


class Summoner(models.Model):
    _id = models.CharField(max_length=128, default='', blank=True, unique=True, db_index=True)
    region = models.CharField(max_length=8, default='', blank=True, db_index=True)
    account_id = models.CharField(max_length=128, default='', blank=True, null=True, db_index=True)
    name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    simple_name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    profile_icon_id = models.IntegerField(default=0)
    puuid = models.CharField(max_length=256, default='', blank=True)
    revision_date = models.BigIntegerField(default=0, db_index=True)
    summoner_level = models.IntegerField(default=0, db_index=True)

    last_summoner_page_import = models.DateTimeField(null=True)
    created_date = models.DateTimeField(default=timezone.now)

    __original_account_id = None
    __original_name = None

    class Meta:
        unique_together = ('region', 'account_id', '_id')

    def __init__(self, *args, **kwargs):
        super(Summoner, self).__init__(*args, **kwargs)
        self.__original_account_id = self.account_id
        self.__original_name = self.name

    def __str__(self):
        return f'Summoner(name="{self.name}", region={self.region})'

    def save(self, *args, **kwargs):
        if self.name:
            self.simple_name = simplify(self.name)

        if self.name != self.__original_name and self.__original_name is not None:
            namechange = NameChange(summoner=self, old_name=self.__original_name)
            namechange.save()
            query = Participant.objects.filter(current_account_id=self.account_id)
            query.update(summoner_name=self.name)

        super(Summoner, self).save(*args, **kwargs)
        self.__original_name = self.name
        self.__original_account_id = self.account_id

    def get_newest_rank_checkpoint(self):
        """Retrieve the most recent checkpoint for the summoner.

        Returns
        -------
        RankCheckpoint or None

        """
        try:
            checkpoint = self.rankcheckpoints.all().order_by('-created_date')[0]
        except:
            checkpoint = None
        return checkpoint



class NameChange(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='namechanges')
    old_name = models.CharField(max_length=128, default='')
    created_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'NameChange(old_name="{self.old_name}", new_name="{self.summoner.name}")'


class RankCheckpoint(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='rankcheckpoints')

    created_date = models.DateTimeField(default=timezone.now)


class RankPosition(models.Model):
    checkpoint = models.ForeignKey('RankCheckpoint', on_delete=models.CASCADE, related_name='positions')

    fresh_blood = models.BooleanField(default=False, blank=True)
    hot_streak = models.BooleanField(default=False, blank=True)
    inactive = models.BooleanField(default=False, blank=True)
    veteran = models.BooleanField(default=False, blank=True)
    league_points = models.IntegerField(default=0, null=True, blank=True)
    wins = models.IntegerField(default=0, blank=True)
    losses = models.IntegerField(default=0, blank=True)
    series_progress = models.CharField(max_length=16, default=None, null=True, blank=True)
    position = models.CharField(max_length=32, default='NONE', null=True, blank=True)
    queue_type = models.CharField(max_length=32, default='', blank=True)
    rank = models.CharField(max_length=32, default='', blank=True)
    tier = models.CharField(max_length=32, default='', blank=True)
