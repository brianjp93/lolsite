from .models import Match, Participant, Stat
from .models import Timeline, Team, Ban

from django.db.utils import IntegrityError

from data.models import Rito

from ext.lol.riot import Riot as RiotAPI

import logging
import time


logger = logging.getLogger(__name__)


def get_riot_api():
    """Get an instance of the RiotAPI wrapper.

    Uses the token stored in the data.Rito model

    Returns
    -------
    RiotAPI or None

    """
    api = None
    query = Rito.objects.all()
    if query.exists():
        rito = query.first()
        if rito.token:
            api = RiotAPI(rito.token)
    return api


def get_match(match_id, region, refresh=False):
    """Import a match by its ID.

    Parameters
    ----------
    match_id : ID
    region : str
    refresh : bool
        Whether or not to re-import the match if it already exists.

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        r = api.match.get(match_id, region=region)
        match = r.json()
        parsed = parse_match(match)
        
        match_data = parsed.pop('match')
        match_model = Match(**match_data)
        try:
            match_model.save()
        except IntegrityError as error:
            if refresh:
                Match.objects.get(_id=match_data['_id']).delete()
                match_model.save()
            else:
                raise error

        participants_data = parsed.pop('participants')
        for _p_data in participants_data:
            timelines_data = _p_data.pop('timelines')
            stats_data = _p_data.pop('stats')

            _p_data['match'] = match_model
            participant_model = Participant(**_p_data)
            participant_model.save()
            for _t_data in timelines_data:
                _t_data['participant'] = participant_model
                timeline_model = Timeline(**_t_data)
                timeline_model.save()
            for _s_data in stats_data:
                _s_data['participant'] = participant_model
                stat_model = Stat(**_s_data)
                stat_model.save()

        teams = parsed.pop('teams')
        for _t_data in teams:
            _t_data['match'] = match_model
            bans = _t_data.pop('bans')

            team_model = Team(**_t_data)
            team_model.save()
            for _ban_data in bans:
                _ban_data['team'] = team_model
                ban_model = Ban(**_ban_data)
                ban_model.save()




def parse_match(data):
    """Parse match data to be saved into models.

    Parameters
    ----------
    data : dict
        JSON match data from Riot API

    Returns
    -------
    dict
        formatted data to be saved into match models

    """
    out = {
        'match': {},
        'participants': [],
        'teams': [],
    }
    version = {i:int(x) for i, x in enumerate(data['gameVersion'].split('.'))}
    match = {
        '_id': data['gameId'],
        'game_creation': data['gameCreation'],
        'game_duration': data['gameDuration'],
        'game_mode': data['gameMode'],
        'game_type': data['gameType'],
        'map_id': data['mapId'],
        'game_version': data['gameVersion'],
        'major': version.get(0, ''),
        'minor': version.get(1, ''),
        'patch': version.get(2, ''),
        'build': version.get(3, ''),
        'platform_id': data['platformId'],
        'queue_id': data['queueId'],
        'season_id': data['seasonId'],
    }
    out['match'] = match

    participants = []
    for pi in data['participantIdentities']:
        player = pi['player']

        p = None
        for _p in data['participants']:
            if _p['participantId'] == pi['participantId']:
                p = _p
                break

        timeline = p['timeline']
        tls = []
        for t_key, t_val in timeline.items():
            if 'deltas' in t_key.lower():
                tl = {'key': t_key}
                for time_key, time_value in t_val.items():
                    tl['start'] = time_key.split('-')[0]
                    tl['end'] = time_key.split('-')[1]
                    tl['value'] = round(time_value, 1)
                tls.append(dict(tl))

        stats = []
        for _s_key, _s_val in p['stats'].items():
            stat = {'key': _s_key}
            if _s_val is True or _s_val is False:
                stat['value_type'] = 'bool'
                stat['value_bool'] = _s_val
            else:
                stat['value_type'] = 'int'
                stat['value_int'] = _s_val
            stats.append(dict(stat))

        participant = {
            '_id': pi['participantId'],
            'account_id': player['accountId'],
            'current_account_id': player['currentAccountId'],
            'current_platform_id': player['currentPlatformId'],
            'match_history_uri': player['matchHistoryUri'],
            'platform_id': player['platformId'],
            'summoner_id': player['summonerId'],
            'summoner_name': player['summonerName'],

            'champion_id': p['championId'],
            'highest_achieved_season_tier': p.get('highestAchievedSeasonTier', ''),
            'spell_1_id': p['spell1Id'],
            'spell_2_id': p['spell2Id'],
            'team_id': p['teamId'],
            'lane': timeline['lane'],
            'role': timeline['role'],

            'timelines': list(tls),
            'stats': list(stats),
        }
        participants.append(dict(participant))
    
    out['participants'] = participants

    teams = []

    for _team in data['teams']:

        bans = []
        for _ban in _team['bans']:
            bans.append({
                    'champion_id': _ban['championId'],
                    'pick_turn': _ban['pickTurn'],
                })

        win = True if _team['win'] == 'Win' else False
        team = {
            '_id': _team['teamId'],
            'baron_kills': _team['baronKills'],
            'dominion_victory_score': _team['dominionVictoryScore'],
            'dragon_kills': _team['dragonKills'],
            'first_baron': _team['firstBaron'],
            'first_blood': _team['firstBlood'],
            'first_dragon': _team['firstDragon'],
            'first_inhibitor': _team['firstInhibitor'],
            'first_rift_herald': _team['firstRiftHerald'],
            'first_tower': _team['firstTower'],
            'inhibitor_kills': _team['inhibitorKills'],
            'rift_herald_kills': _team['riftHeraldKills'],
            'tower_kills': _team['towerKills'],
            'vilemaw_kills': _team['vilemawKills'],
            'win': win,
            'win_str': _team['win'],

            'bans': list(bans),
        }
        teams.append(dict(team))
    out['teams'] = teams
    return out


def get_season_matches(season_id, account_id, region, **kwargs):
    """Get season matches for a specific account_id.

    Parameters
    ----------
    season_id : ID
    account_id : ID
        the encrypted account ID
    queue : int

    Returns
    -------
    None

    """
    has_more = True
    api = get_riot_api()
    if api:
        index = 0
        size = 100
        while has_more:
            kwargs['beginIndex'] = index
            r = api.match.filter(account_id, region=region, season=season_id, **kwargs)
            try:
                matches = r.json()['matches']
            except Exception as error:
                print(r.content)
                print(r.headers)
                raise error
            if len(matches) > 0:
                for match in r.json()['matches']:
                    match_id = match['gameId']
                    query = Match.objects.filter(_id=match_id)
                    # if it doesn't exist, import it
                    if not query.exists():
                        print(f'importing {match_id}')
                        try:
                            get_match(match_id, region)
                        except Exception as error:
                            time.sleep(5)
                            get_match(match_id, region)
                    else:
                        print(f'skipping {match_id}')
            else:
                has_more = False
            index += size


def import_recent_matches(count, account_id, region, **kwargs):
    """Get recent matches for an account_id.

    Parameters
    ----------
    season_id : ID
    account_id : ID
        the encrypted account ID
    queue : int

    Returns
    -------
    None

    """
    has_more = True
    api = get_riot_api()
    if api:
        index = 0
        size = 100
        import_count = 0
        please_continue = True
        while has_more and please_continue:
            kwargs['beginIndex'] = index
            kwargs['endIndex'] = index + size
            r = api.match.filter(account_id, region=region, **kwargs)
            try:
                matches = r.json()['matches']
            except Exception as error:
                print(r.content)
                print(r.headers)
                raise error
            if len(matches) > 0:
                for match in r.json()['matches']:
                    match_id = match['gameId']
                    query = Match.objects.filter(_id=match_id)
                    # if it doesn't exist, import it
                    if not query.exists():
                        print(f'importing {match_id}')
                        try:
                            get_match(match_id, region)
                        except Exception as error:
                            time.sleep(5)
                            get_match(match_id, region)
                    else:
                        print(f'skipping {match_id}')
                    import_count += 1
                    if import_count >= count:
                        please_continue = False
            else:
                has_more = False
            index += size