from django.db import models

from django.utils import timezone


class League(models.Model):
    _id = models.IntegerField(default=0, blank=True, db_index=True, unique=True)
    slug = models.CharField(max_length=32, default='', blank=True)
    name = models.CharField(max_length=32, default='', blank=True)
    guid = models.CharField(max_length=64, default='', blank=True)
    region = models.CharField(max_length=16, default='', blank=True)
    drupal_id = models.IntegerField(default=0, blank=True)
    logo_url = models.CharField(max_length=128, default='', blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    created_date = models.DateTimeField(default=timezone.now)
    modified_date = models.DateTimeField(auto_now=True)


class LeagueAbout(models.Model):
    league = models.ForeignKey('League', related_name='abouts', on_delete=models.CASCADE)
    language = models.CharField(max_length=128, default='', blank=True)
    value = models.CharField(max_length=100000, default='', blank=True)

    class Meta:
        unique_together = ('league', 'language')


class LeagueName(models.Model):
    league = models.ForeignKey('League', related_name='names', on_delete=models.CASCADE)
    language = models.CharField(max_length=128, default='', blank=True)
    value = models.CharField(max_length=64, default='', blank=True)

    class Meta:
        unique_together = ('league', 'language')


class LeagueTournament(models.Model):
    league = models.ForeignKey('League', related_name='tournaments', on_delete=models.CASCADE)
    _id = models.CharField(max_length=128, default='', blank=True)
    title = models.CharField(max_length=256, default='', blank=True)
    description = models.CharField(max_length=256, default='', blank=True)
    league_reference = models.CharField(max_length=256, default='', blank=True)
    start_date = models.DateField(null=True, db_index=True)
    end_date = models.DateField(null=True)

    class Meta:
        unique_together = ('league', '_id')


class TournamentRoster(models.Model):
    tournament = models.ForeignKey('LeagueTournament', related_name='rosters', on_delete=models.CASCADE)
    _id = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=32, default='', blank=True)
    team_reference = models.CharField(max_length=128, default='', blank=True)
    team = models.IntegerField(default=0)

    class Meta:
        unique_together = ('tournament', '_id')


class TournamentBreakpoint(models.Model):
    tournament = models.ForeignKey('LeagueTournament', related_name='breakpoints', on_delete=models.CASCADE)
    _id = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    position = models.IntegerField(default=0)


class BreakpointInput(models.Model):
    breakpoint = models.ForeignKey('TournamentBreakpoint', related_name='inputs', on_delete=models.CASCADE)
    roster = models.ForeignKey('TournamentRoster', related_name='breakpointinputs', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('breakpoint', 'roster')


class BreakpointStandings(models.Model):
    breakpoint = models.OneToOneField('TournamentBreakpoint', related_name='standings', on_delete=models.CASCADE)
    timestamp = models.IntegerField(default=0, blank=True)
    closed = models.BooleanField(default=False, blank=True)


class StandingResult(models.Model):
    standing = models.ForeignKey('BreakpointStandings', related_name='results', on_delete=models.CASCADE)
    sort_int = models.IntegerField(default=0)
    roster = models.ForeignKey('TournamentRoster', related_name='standingresults', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('standing', 'sort_int')


class TournamentBracket(models.Model):
    tournament = models.ForeignKey('LeagueTournament', related_name='brackets', on_delete=models.CASCADE)
    _id = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    position = models.IntegerField(default=0, blank=True)
    group_position = models.IntegerField(default=0, blank=True)
    group_name = models.CharField(max_length=128, default='', blank=True)
    can_manufacture = models.BooleanField(default=False, blank=True)
    state = models.CharField(max_length=128, default='', blank=True)


class BracketInput(models.Model):
    bracket = models.ForeignKey('TournamentBracket', related_name='inputs', on_delete=models.CASCADE)
    roster = models.ForeignKey('TournamentRoster', related_name='bracketinputs', on_delete=models.CASCADE)
    breakpoint = models.ForeignKey('TournamentBreakpoint', related_name='bracketinputs', on_delete=models.CASCADE)
    standing = models.IntegerField(default=0, blank=True)

    class Meta:
        unique_together = ('bracket', 'roster', 'breakpoint', 'standing')


class BracketMatch(models.Model):
    bracket = models.ForeignKey('TournamentBracket', related_name='matches', on_delete=models.CASCADE)
    _id = models.IntegerField(default=0, blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    position = models.IntegerField(default=0, blank=True)
    state = models.CharField(max_length=128, default='')
    group_position = models.IntegerField(default=0)
    best_of = models.IntegerField(default=1)

    class Meta:
        unique_together = ('bracket', '_id')


class MatchInput(models.Model):
    match = models.ForeignKey('BracketMatch', related_name='inputs', on_delete=models.CASCADE)
    roster = models.ForeignKey('TournamentRoster', related_name='matchinputs', on_delete=models.CASCADE)
    breakpoint = models.ForeignKey('TournamentBreakpoint', related_name='matchinputs', on_delete=models.CASCADE)
    standing = models.IntegerField(default=0)

    class Meta:
        unique_together = ('match', 'roster')


class MatchGame(models.Model):
    match = models.ForeignKey('BracketMatch', related_name='games', on_delete=models.CASCADE)
    match_model = models.OneToOneField('match.Match', null=True, on_delete=models.SET_NULL, blank=True)
    _id = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    generated_name = models.CharField(max_length=128, default='', blank=True)
    game_id = models.CharField(max_length=128, default='', blank=True)
    game_realm = models.CharField(max_length=128, default='', blank=True)
    platform_id = models.CharField(max_length=128, default='', blank=True)

    class Meta:
        unique_together = ('match', '_id')


class GameInput(models.Model):
    game = models.ForeignKey('MatchGame', related_name='games', on_delete=models.CASCADE)
    roster = models.ForeignKey('TournamentRoster', related_name='gameinputs', on_delete=models.CASCADE)
    breakpoint = models.ForeignKey('TournamentBreakpoint', related_name='gameinputs', on_delete=models.CASCADE)
    standing = models.IntegerField(default=0)

    class Meta:
        unique_together = ('game', 'roster')


# HIGHLANDER MATCH DETAILS

class MatchDetails(models.Model):
    match = models.OneToOneField('BracketMatch', related_name='details', on_delete=models.CASCADE)


class Mapping(models.Model):
    details = models.ForeignKey('MatchDetails', related_name='mappings', on_delete=models.CASCADE)
    game_hash = models.CharField(max_length=128, default='', blank=True)
    _id = models.CharField(max_length=128, default='', blank=True)

    class Meta:
        unique_together = ('details', '_id')


class Team(models.Model):
    details = models.ForeignKey('MatchDetails', related_name='teams', on_delete=models.CASCADE)
    _id = models.IntegerField()
    slug = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    guid = models.CharField(max_length=128, default='', blank=True)
    team_photo_url = models.CharField(max_length=128, default='', blank=True, null=True)
    logo_url = models.CharField(max_length=128, default='', blank=True, null=True)
    acronym = models.CharField(max_length=16, default='', blank=True)
    home_league = models.CharField(max_length=128, default='', blank=True)
    alt_logo_url = models.CharField(max_length=128, default='', blank=True)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        unique_together = ('details', '_id')


class MatchPlayer(models.Model):
    details = models.ForeignKey('MatchDetails', related_name='players', on_delete=models.CASCADE)
    team = models.ForeignKey('Team', related_name='players', on_delete=models.CASCADE)
    first_name = models.CharField(max_length=128, default='', blank=True)
    last_name = models.CharField(max_length=128, default='', blank=True)
    hometown = models.CharField(max_length=128, default=None, null=True, blank=True)
    live_game_team = models.IntegerField(null=True, default=None)
    name = models.CharField(max_length=128, default='', blank=True)
    photo_url = models.CharField(max_length=128, default='', blank=True)
    region = models.CharField(max_length=128, default='', blank=True)
    role_slug = models.CharField(max_length=128, default='', blank=True)
    slug = models.CharField(max_length=128, default='', blank=True)
    is_starter = models.BooleanField(default=False)
    is_sub = models.BooleanField(default=False)

    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        unique_together = ('details', 'name')


class ScheduleItem(models.Model):
    details = models.ForeignKey('MatchDetails', related_name='scheduleitems', on_delete=models.CASCADE)
    _id = models.CharField(max_length=128, default='', blank=True)
    content = models.CharField(max_length=256, default='', blank=True)
    scheduled_time = models.DateTimeField(null=True, db_index=True)
    block_label = models.IntegerField(null=True)
    block_prefix = models.CharField(max_length=128, default='', blank=True)
    sub_block_label = models.IntegerField(null=True)
    sub_block_prefix = models.CharField(max_length=128, default='', blank=True)
    stage_label = models.CharField(max_length=128, default='', blank=True)
    league_label = models.CharField(max_length=128, default='', blank=True)
    tournament_label = models.CharField(max_length=128, default='', blank=True)

    class Meta:
        unique_together = ('details', '_id')


class Video(models.Model):
    details = models.ForeignKey('MatchDetails', related_name='videos', on_delete=models.CASCADE)
    _id = models.IntegerField(default=0)
    slug = models.CharField(max_length=128, default='', null=True, blank=True)
    label = models.CharField(max_length=128, default='', null=True, blank=True)
    locale = models.CharField(max_length=128, default='', blank=True)
    reference = models.CharField(max_length=128, default='', blank=True)
    source = models.CharField(max_length=128, default='', blank=True)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        unique_together = ('details', '_id')

