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
    account_id = models.CharField(max_length=128, default='', blank=True, unique=True, db_index=True)
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

        # if self.account_id != self.__original_account_id and self.__original_name is not None:
        #     print('Account ID Change')
        #     query = Participant.objects.filter(current_account_id=self.__original_account_id)
        #     query.update(current_account_id=self.account_id)

        if self.name != self.__original_name and self.__original_name is not None:
            namechange = NameChange(summoner=self, old_name=self.__original_name)
            namechange.save()
            query = Participant.objects.filter(current_account_id=self.account_id)
            query.update(summoner_name=self.name)

        super(Summoner, self).save(*args, **kwargs)
        self.__original_name = self.name
        self.__original_account_id = self.account_id


class NameChange(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='namechanges')
    old_name = models.CharField(max_length=128, default='')
    created_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'NameChange(old_name="{self.old_name}", new_name="{self.summoner.name}")'