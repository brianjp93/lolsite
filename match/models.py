from django.db import models
from django.utils import timezone
import pytz


class Match(models.Model):
    _id = models.BigIntegerField(unique=True)
    game_creation = models.BigIntegerField()
    game_duration = models.IntegerField()
    game_mode = models.CharField(max_length=32, default='', blank=True)
    game_type = models.CharField(max_length=32, default='', blank=True)
    map_id = models.IntegerField()
    platform_id = models.CharField(max_length=16, default='', blank=True, db_index=True)
    queue_id = models.IntegerField(db_index=True)
    season_id = models.IntegerField(db_index=True)

    game_version = models.CharField(max_length=32, default='', blank=True)
    major = models.IntegerField(db_index=True)
    minor = models.IntegerField(db_index=True)
    patch = models.IntegerField()
    build = models.IntegerField()

    def __str__(self):
        return f'Match(_id={self._id}, queue_id={self.queue_id}, game_version={self.game_version})'

    def get_creation(self):
        """Get creation as datetime
        """
        dt = timezone.datetime.fromtimestamp(self.game_creation // 1000, tz=pytz.utc)
        return dt

class Participant(models.Model):
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='participants')
    _id = models.IntegerField() # participantID

    account_id = models.CharField(max_length=128, default='', blank=True, db_index=True)
    current_account_id = models.CharField(max_length=128, default='', blank=True)
    current_platform_id = models.CharField(max_length=16, default='', blank=True)
    platform_id = models.CharField(max_length=16, default='', blank=True)
    match_history_uri = models.CharField(max_length=128, default='', blank=True)
    summoner_id = models.CharField(max_length=128, default='', blank=True, db_index=True)
    summoner_name = models.CharField(max_length=256, default='', blank=True)

    champion_id = models.IntegerField()
    highest_achieved_season_tier = models.CharField(max_length=64, default='', blank=True)
    spell_1_id = models.IntegerField()
    spell_2_id = models.IntegerField()
    team_id = models.IntegerField()

    # from timeline
    lane = models.CharField(max_length=64, default='', blank=True)
    role = models.CharField(max_length=64, default='', blank=True)

    class Meta:
        unique_together = ('match', '_id')

    def __str__(self):
        return f'Participant(summoner_name={self.summoner_name}, match={self.match._id})'


class Stat(models.Model):
    type_choices = (
        ('bool', 'bool'),
        ('int', 'int'),
        )
    participant = models.ForeignKey('Participant', on_delete=models.CASCADE, related_name='stats')
    key = models.CharField(max_length=128, default='', blank=True)
    value_type = models.CharField(choices=type_choices, max_length=16, default='int', blank=True)
    value_bool = models.BooleanField(default=False, blank=True)
    value_int = models.BigIntegerField(default=0, blank=True)

    class Meta:
        unique_together = ('participant', 'key')


    def __str__(self):
        return f'Stat(participant={self.participant.summoner_name}, match={self.participant.match._id}, key={self.key})'


class Timeline(models.Model):
    participant = models.ForeignKey('Participant', on_delete=models.CASCADE, related_name='timelines')
    key = models.CharField(max_length=256, default='', blank=True)
    value = models.FloatField(default=0, blank=True)
    start = models.IntegerField()
    end = models.IntegerField()

    class Meta:
        unique_together = ('participant', 'key', 'start')


class Team(models.Model):
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='teams')
    _id = models.IntegerField()

    baron_kills = models.IntegerField(default=0, blank=True)
    dominion_victory_score = models.IntegerField(default=0, blank=True)
    dragon_kills = models.IntegerField(default=0, blank=True)
    first_baron = models.BooleanField(default=False, blank=True)
    first_blood = models.BooleanField(default=False, blank=True)
    first_dragon = models.BooleanField(default=False, blank=True)
    first_inhibitor = models.BooleanField(default=False, blank=True)
    first_rift_herald = models.BooleanField(default=False, blank=True)
    first_tower = models.BooleanField(default=False, blank=True)
    inhibitor_kills = models.IntegerField(default=0, blank=True)
    rift_herald_kills = models.IntegerField(default=0, blank=True)
    tower_kills = models.IntegerField(default=0, blank=True)
    vilemaw_kills = models.IntegerField(default=0, blank=True)
    win = models.BooleanField(default=False, blank=True) # this is a string field in the api but it should be a boolean
    win_str = models.CharField(default='', blank=True, db_index=True, max_length=128)


    def __str__(self):
        return f'Team(match={self.match._id}, _id={self._id})'


class Ban(models.Model):
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='bans')
    champion_id = models.IntegerField()
    pick_turn = models.IntegerField()

    def __str__(self):
        return f'Ban(team={self.team._id}, match={self.team.match._id})'