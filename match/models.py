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
    summoner_id = models.CharField(max_length=128, default='', blank=True, db_index=True, null=True)
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


# class Stat(models.Model):
#     type_choices = (
#         ('bool', 'bool'),
#         ('int', 'int'),
#         )
#     participant = models.ForeignKey('Participant', on_delete=models.CASCADE, related_name='stats')
#     key = models.CharField(max_length=128, default='', blank=True)
#     value_type = models.CharField(choices=type_choices, max_length=16, default='int', blank=True)
#     value_bool = models.BooleanField(default=False, blank=True)
#     value_int = models.BigIntegerField(default=0, blank=True)

#     class Meta:
#         unique_together = ('participant', 'key')


#     def __str__(self):
        # return f'Stat(participant={self.participant.summoner_name}, match={self.participant.match._id}, key={self.key})'


class Stats(models.Model):
    participant = models.OneToOneField('Participant', on_delete=models.CASCADE)

    assists = models.IntegerField(default=0, blank=True)
    champ_level = models.IntegerField(default=0, null=True, blank=True)
    combat_player_score = models.IntegerField(default=0, blank=True)
    damage_dealt_to_objectives = models.IntegerField(default=0, blank=True)
    damage_dealt_to_turrets = models.IntegerField(default=0, blank=True)
    damage_self_mitigated = models.IntegerField(default=0, blank=True)
    deaths = models.IntegerField(default=0, blank=True)
    double_kills = models.IntegerField(default=0, blank=True)
    first_blood_assist = models.BooleanField(default=False, blank=True)
    first_blood_kill = models.BooleanField(default=False, blank=True)
    first_inhibitor_assist = models.BooleanField(default=False, blank=True)
    first_inhibitor_kill = models.BooleanField(default=False, blank=True)
    first_tower_assist = models.BooleanField(default=False, blank=True)
    first_tower_kill = models.BooleanField(default=False, blank=True)
    gold_earned = models.IntegerField(default=0, blank=True)
    gold_spent = models.IntegerField(default=0, blank=True)
    inhibitor_kills = models.IntegerField(default=0, blank=True)
    item_0 = models.IntegerField(default=0, blank=True)
    item_1 = models.IntegerField(default=0, blank=True)
    item_2 = models.IntegerField(default=0, blank=True)
    item_3 = models.IntegerField(default=0, blank=True)
    item_4 = models.IntegerField(default=0, blank=True)
    item_5 = models.IntegerField(default=0, blank=True)
    item_6 = models.IntegerField(default=0, blank=True)
    killing_sprees = models.IntegerField(default=0, blank=True)
    kills = models.IntegerField(default=0, blank=True)
    largest_critical_strike = models.IntegerField(default=0, blank=True)
    largest_killing_spree = models.IntegerField(default=0, blank=True)
    largest_multi_kill = models.IntegerField(default=0, blank=True)
    longest_time_spent_living = models.IntegerField(default=0, blank=True)
    magic_damage_dealt = models.IntegerField(default=0, blank=True)
    magic_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    magical_damage_taken = models.IntegerField(default=0, blank=True)
    neutral_minions_killed = models.IntegerField(default=0, blank=True)
    neutral_minions_killed_enemy_jungle = models.IntegerField(default=0, blank=True)
    neutral_minions_killed_team_jungle = models.IntegerField(default=0, blank=True)
    objective_player_score = models.IntegerField(default=0, blank=True)
    penta_kills = models.IntegerField(default=0, blank=True)

    perk_0 = models.IntegerField(default=0, blank=True)
    perk_0_var_1 = models.IntegerField(default=0, blank=True)
    perk_0_var_2 = models.IntegerField(default=0, blank=True)
    perk_0_var_3 = models.IntegerField(default=0, blank=True)

    perk_1 = models.IntegerField(default=0, blank=True)
    perk_1_var_1 = models.IntegerField(default=0, blank=True)
    perk_1_var_2 = models.IntegerField(default=0, blank=True)
    perk_1_var_3 = models.IntegerField(default=0, blank=True)

    perk_2 = models.IntegerField(default=0, blank=True)
    perk_2_var_1 = models.IntegerField(default=0, blank=True)
    perk_2_var_2 = models.IntegerField(default=0, blank=True)
    perk_2_var_3 = models.IntegerField(default=0, blank=True)

    perk_3 = models.IntegerField(default=0, blank=True)
    perk_3_var_1 = models.IntegerField(default=0, blank=True)
    perk_3_var_2 = models.IntegerField(default=0, blank=True)
    perk_3_var_3 = models.IntegerField(default=0, blank=True)

    perk_4 = models.IntegerField(default=0, blank=True)
    perk_4_var_1 = models.IntegerField(default=0, blank=True)
    perk_4_var_2 = models.IntegerField(default=0, blank=True)
    perk_4_var_3 = models.IntegerField(default=0, blank=True)

    perk_5 = models.IntegerField(default=0, blank=True)
    perk_5_var_1 = models.IntegerField(default=0, blank=True)
    perk_5_var_2 = models.IntegerField(default=0, blank=True)
    perk_5_var_3 = models.IntegerField(default=0, blank=True)

    perk_primary_style = models.IntegerField(default=0, blank=True)
    perk_sub_style = models.IntegerField(default=0, blank=True)
    physical_damage_dealt = models.IntegerField(default=0, blank=True)
    physical_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    physical_damage_taken = models.IntegerField(default=0, blank=True)

    player_score_0 = models.IntegerField(default=0, blank=True)
    player_score_1 = models.IntegerField(default=0, blank=True)
    player_score_2 = models.IntegerField(default=0, blank=True)
    player_score_3 = models.IntegerField(default=0, blank=True)
    player_score_4 = models.IntegerField(default=0, blank=True)
    player_score_5 = models.IntegerField(default=0, blank=True)
    player_score_6 = models.IntegerField(default=0, blank=True)
    player_score_7 = models.IntegerField(default=0, blank=True)
    player_score_8 = models.IntegerField(default=0, blank=True)
    player_score_9 = models.IntegerField(default=0, blank=True)

    quadra_kills = models.IntegerField(default=0, blank=True)
    sight_wards_bought_in_game = models.IntegerField(default=0, blank=True)

    stat_perk_0 = models.IntegerField(default=0, blank=True)
    stat_perk_1 = models.IntegerField(default=0, blank=True)
    stat_perk_2 = models.IntegerField(default=0, blank=True)

    time_ccing_others = models.IntegerField(default=0, blank=True)
    total_damage_dealt = models.IntegerField(default=0, blank=True)
    total_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    total_damage_taken = models.IntegerField(default=0, blank=True)
    total_heal = models.IntegerField(default=0, blank=True)
    total_minions_killed = models.IntegerField(default=0, blank=True)
    total_player_score = models.IntegerField(default=0, blank=True)
    total_score_rank = models.IntegerField(default=0, blank=True)
    total_time_crowd_control_dealt = models.IntegerField(default=0, blank=True)
    total_units_healed = models.IntegerField(default=0, blank=True)
    triple_kills = models.IntegerField(default=0, blank=True)
    true_damage_dealt = models.IntegerField(default=0, blank=True)
    true_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    true_damage_taken = models.IntegerField(default=0, blank=True)
    turret_kills = models.IntegerField(default=0, blank=True)
    unreal_kills = models.IntegerField(default=0, blank=True)
    vision_score = models.IntegerField(default=0, blank=True)
    vision_wards_bought_in_game = models.IntegerField(default=0, blank=True)
    wards_killed = models.IntegerField(default=0, blank=True)
    wards_placed = models.IntegerField(default=0, blank=True)
    win = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f'Stats(participant={self.participant.summoner_name})'


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