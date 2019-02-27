from django.db import models
from django.utils import timezone


class Summoner(models.Model):
    _id = models.CharField(max_length=128, default='', blank=True, unique=True, db_index=True)
    region = models.CharField(max_length=8, default='', blank=True, db_index=True)
    account_id = models.CharField(max_length=128, default='', blank=True, unique=True, db_index=True)
    name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    simple_name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    profile_icon_id = models.IntegerField(default=0)
    puuid = models.CharField(max_length=256, default='', blank=True, unique=True)
    revision_date = models.BigIntegerField(default=0, db_index=True)
    summoner_level = models.IntegerField(default=0, db_index=True)

    last_summoner_page_import = models.DateTimeField(null=True)
    created_date = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('region', 'name')

    def __str__(self):
        return f'Summoner(name="{self.name}", region={self.region})'

    def save(self, *args, **kwargs):
        if self.name:
            self.simple_name = ''.join(self.name.split()).lower()
        super(Summoner, self).save(*args, **kwargs)


class NameChange(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='namechanges')
    old_name = models.CharField(max_length=128, default='')
    created_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'NameChange(old_name="{self.old_name}", new_name="{summoner.name}")'