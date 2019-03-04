from django.db.utils import IntegrityError
from django.db.models import Count, Subquery, OuterRef

from .models import Match, Participant, Stats
from .models import Timeline, Team, Ban

from .models import AdvancedTimeline, Frame, ParticipantFrame
from .models import Position, Event, AssistingParticipants

from data.models import Rito

from player.models import Summoner

from ext.lol.riot import Riot as RiotAPI

from celery import task
import logging
from multiprocessing.dummy import Pool as ThreadPool
import time


logger = logging.getLogger(__name__)

class RateLimitError(Exception):
    pass

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


def import_match(match_id, region, refresh=False):
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

        if r.status_code == 429:
            return 'throttled'
        
        import_match_from_data(match, refresh=refresh, region=region)
        

def import_summoner_from_participant(part, region):
    """
    """
    query = Summoner.objects.filter(account_id=part['current_account_id'], _id=part['summoner_id'])
    if query.exists():
        # don't need to create it again
        pass
    else:
        account_id = part['current_account_id']
        name = part['summoner_name']
        _id = part['summoner_id']
        summoner = Summoner(_id=_id, name=name, account_id=account_id, region=region.lower())
        summoner.save()



def import_match_from_data(data, refresh=False, region=''):
    """Import a match given the riot data response json.
    """
    parsed = parse_match(data)
    
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

        try:
            import_summoner_from_participant(_p_data, region)
        except IntegrityError as error:
            match_model.delete()
            raise error        

        timelines_data = _p_data.pop('timelines')
        stats_data = _p_data.pop('stats')

        _p_data['match'] = match_model

        # PARTICIPANT
        participant_model = Participant(**_p_data)
        try:
            participant_model.save()
        except Exception as error:
            match_model.delete()
            raise error

        # TIMELINES
        for _t_data in timelines_data:
            _t_data['participant'] = participant_model
            timeline_model = Timeline(**_t_data)
            try:
                timeline_model.save()
            except Exception as error:
                match_model.delete()
                raise error

        # STATS
        stats_data['participant'] = participant_model
        stats_model = Stats(**stats_data)
        try:
            stats_model.save()
        except IntegrityError as error:
            match_model.delete()
            raise error

    # TEAMS
    teams = parsed.pop('teams')
    for _t_data in teams:
        _t_data['match'] = match_model
        bans = _t_data.pop('bans')

        team_model = Team(**_t_data)
        try:
            team_model.save()
        except Exception as error:
            team_model.delete()
            raise error

        # BANS
        for _ban_data in bans:
            _ban_data['team'] = team_model
            ban_model = Ban(**_ban_data)
            try:
                ban_model.save()
            except Exception as error:
                ban_model.delete()
                raise error


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

        timeline = p.get('timeline', {})
        tls = []
        for t_key, t_val in timeline.items():
            if 'deltas' in t_key.lower():
                tl = {'key': t_key}
                for time_key, time_value in t_val.items():
                    tl['start'] = time_key.split('-')[0]
                    tl['end'] = time_key.split('-')[1]
                    tl['value'] = round(time_value, 1)
                tls.append(dict(tl))

        _s = p['stats']
        stats = {
            'assists': _s['assists'],
            'champ_level': _s['champLevel'],
            'combat_player_score': _s['combatPlayerScore'],
            'damage_dealt_to_objectives': _s['damageDealtToObjectives'],
            'damage_dealt_to_turrets': _s['damageDealtToTurrets'],
            'damage_self_mitigated': _s['damageSelfMitigated'],
            'deaths': _s['deaths'],
            'double_kills': _s['doubleKills'],

            'first_blood_assist': _s.get('firstBloodAssist', False),
            'first_blood_kill': _s.get('firstBloodKill', False),
            'first_inhibitor_assist': _s.get('firstInhibitorAssist', False),
            'first_inhibitor_kill': _s.get('firstInhibitorKill', False),
            'first_tower_assist': _s.get('firstTowerAssist', False),
            'first_tower_kill': _s.get('firstTowerKill', False),

            'gold_earned': _s['goldEarned'],
            'gold_spent': _s['goldSpent'],
            'inhibitor_kills': _s.get('inhibitorKills', 0),
            'item_0': _s['item0'],
            'item_1': _s['item1'],
            'item_2': _s['item2'],
            'item_3': _s['item3'],
            'item_4': _s['item4'],
            'item_5': _s['item5'],
            'item_6': _s['item6'],
            'killing_sprees': _s['killingSprees'],
            'kills': _s['kills'],
            'largest_critical_strike': _s['largestCriticalStrike'],
            'largest_killing_spree': _s['largestKillingSpree'],
            'largest_multi_kill': _s['largestMultiKill'],
            'longest_time_spent_living': _s['longestTimeSpentLiving'],
            'magic_damage_dealt': _s['magicDamageDealt'],
            'magic_damage_dealt_to_champions': _s['magicDamageDealtToChampions'],
            'magical_damage_taken': _s['magicalDamageTaken'],
            'neutral_minions_killed': _s['neutralMinionsKilled'],
            'neutral_minions_killed_enemy_jungle': _s.get('neutralMinionsKilledEnemyJungle', 0),
            'neutral_minions_killed_team_jungle': _s.get('neutralMinionsKilledTeamJungle', 0),
            'objective_player_score': _s['objectivePlayerScore'],
            'penta_kills': _s['pentaKills'],

            'perk_0': _s.get('perk0', 0),
            'perk_0_var_1': _s.get('perk0Var1', 0),
            'perk_0_var_2': _s.get('perk0Var2', 0),
            'perk_0_var_3': _s.get('perk0Var3', 0),

            'perk_1': _s.get('perk1', 0),
            'perk_1_var_1': _s.get('perk1Var1', 0),
            'perk_1_var_2': _s.get('perk1Var2', 0),
            'perk_1_var_3': _s.get('perk1Var3', 0),

            'perk_2': _s.get('perk2', 0),
            'perk_2_var_1': _s.get('perk2Var1', 0),
            'perk_2_var_2': _s.get('perk2Var2', 0),
            'perk_2_var_3': _s.get('perk2Var3', 0),

            'perk_3': _s.get('perk3', 0),
            'perk_3_var_1': _s.get('perk3Var1', 0),
            'perk_3_var_2': _s.get('perk3Var2', 0),
            'perk_3_var_3': _s.get('perk3Var3', 0),

            'perk_4': _s.get('perk4', 0),
            'perk_4_var_1': _s.get('perk4Var1', 0),
            'perk_4_var_2': _s.get('perk4Var2', 0),
            'perk_4_var_3': _s.get('perk4Var3', 0),

            'perk_5': _s.get('perk5', 0),
            'perk_5_var_1': _s.get('perk5Var1', 0),
            'perk_5_var_2': _s.get('perk5Var2', 0),
            'perk_5_var_3': _s.get('perk5Var3', 0),

            'perk_primary_style': _s.get('perkPrimaryStyle', 0),
            'perk_sub_style': _s.get('perkSubStyle', 0),

            'physical_damage_dealt': _s['physicalDamageDealt'],
            'physical_damage_dealt_to_champions': _s['physicalDamageDealtToChampions'],
            'physical_damage_taken': _s['physicalDamageTaken'],

            'player_score_0': _s['playerScore0'],
            'player_score_1': _s['playerScore1'],
            'player_score_2': _s['playerScore2'],
            'player_score_3': _s['playerScore3'],
            'player_score_4': _s['playerScore4'],
            'player_score_5': _s['playerScore5'],
            'player_score_6': _s['playerScore6'],
            'player_score_7': _s['playerScore7'],
            'player_score_8': _s['playerScore8'],
            'player_score_9': _s['playerScore9'],

            'quadra_kills': _s['quadraKills'],
            'sight_wards_bought_in_game': _s['sightWardsBoughtInGame'],

            'stat_perk_0': _s.get('statPerk0', 0),
            'stat_perk_1': _s.get('statPerk1', 0),
            'stat_perk_2': _s.get('statPerk2', 0),

            'time_ccing_others': _s['timeCCingOthers'],
            'total_damage_dealt': _s['totalDamageDealt'],
            'total_damage_dealt_to_champions': _s['totalDamageDealtToChampions'],
            'total_damage_taken': _s['totalDamageTaken'],
            'total_heal': _s['totalHeal'],
            'total_minions_killed': _s['totalMinionsKilled'],
            'total_player_score': _s['totalPlayerScore'],
            'total_score_rank': _s['totalScoreRank'],
            'total_time_crowd_control_dealt': _s['totalTimeCrowdControlDealt'],
            'total_units_healed': _s['totalUnitsHealed'],
            'triple_kills': _s['tripleKills'],
            'true_damage_dealt': _s['trueDamageDealt'],
            'true_damage_dealt_to_champions': _s['trueDamageDealtToChampions'],
            'true_damage_taken': _s['trueDamageTaken'],
            'turret_kills': _s.get('turretKills', 0),
            'unreal_kills': _s['unrealKills'],
            'vision_score': _s['visionScore'],
            'vision_wards_bought_in_game': _s['visionWardsBoughtInGame'],
            'wards_killed': _s.get('wardsKilled', 0),
            'wards_placed': _s.get('wardsPlaced', 0),
            'win': _s['win'],
        }

        participant = {
            '_id': pi['participantId'],
            'account_id': player['accountId'],
            'current_account_id': player['currentAccountId'],
            'current_platform_id': player['currentPlatformId'],
            'match_history_uri': player['matchHistoryUri'],
            'platform_id': player['platformId'],
            'summoner_id': player.get('summonerId', None),
            'summoner_name': player['summonerName'],

            'champion_id': p['championId'],
            'highest_achieved_season_tier': p.get('highestAchievedSeasonTier', ''),
            'spell_1_id': p['spell1Id'],
            'spell_2_id': p['spell2Id'],
            'team_id': p['teamId'],
            'lane': timeline.get('lane', ''),
            'role': timeline.get('role', ''),

            'timelines': list(tls),
            'stats': dict(stats),
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

        win = True if _team.get('win', 'Fail') == 'Win' else False
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
            'win_str': _team.get('win', 'Fail'),

            'bans': list(bans),
        }
        teams.append(dict(team))
    out['teams'] = teams
    return out


def import_season_matches(season_id, account_id, region, **kwargs):
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
            print('getting list')
            r = api.match.filter(account_id, region=region, season=season_id, **kwargs)
            try:
                matches = r.json()['matches']
            except Exception as error:
                print(r.content)
                print(r.headers)
                r = api.match.filter(account_id, region=region, season=season_id, **kwargs)
                matches = r.json()['matches']
            if len(matches) > 0:
                for match in r.json()['matches']:
                    match_id = match['gameId']
                    query = Match.objects.filter(_id=match_id)
                    # if it doesn't exist, import it
                    if not query.exists():
                        print(f'importing {match_id}')
                        try:
                            import_match(match_id, region)
                        except KeyError as error:
                            print('Waiting...')
                            time.sleep(10)
                            import_match(match_id, region)
                    else:
                        print(f'skipping {match_id}')
            else:
                has_more = False
            index += size


def import_recent_matches(start, end, account_id, region, **kwargs):
    """Import recent matches for an account_id.

    Parameters
    ----------
    start : int
    end : int
    season_id : ID
    account_id : ID
        the encrypted account ID
    queue : int
    beginTime : Epoch in ms
    endTime : Epoch in ms

    Returns
    -------
    None

    """
    has_more = True
    api = get_riot_api()
    if api:
        index = start
        size = 100
        please_continue = True
        while has_more and please_continue:
            kwargs['beginIndex'] = index
            end_index = index + size
            if end_index > end:
                end_index = end
            kwargs['endIndex'] = end_index
            r = api.match.filter(account_id, region=region, **kwargs)
            try:
                matches = r.json()['matches']
            except Exception as error:
                time.sleep(10)
                r = api.match.filter(account_id, region=region, **kwargs)
                matches = r.json()['matches']
            if len(matches) > 0:
                threads = 5
                new_matches = [x for x in matches if not Match.objects.filter(_id=x['gameId']).exists()]
                pool = ThreadPool(5)
                vals = pool.map(lambda x: import_match(x['gameId'], region), new_matches)
                # print(vals)
            else:
                has_more = False
            index += size
            if index >= end:
                please_continue = False


def get_top_played_with(summoner_id, team=True, season_id=None, queue_id=None, recent=None, group_by='summoner_name'):
    """

    Parameters
    ----------
    summoner_id : int
        The *internal* Summoner ID
    team : bool
        Only count players who were on the same team
    season_id : int
    queue_id : int
    recent : int
        count of most recent games to check

    Returns
    -------
    query of counts

    """
    summoner = Summoner.objects.get(id=summoner_id)

    p = Participant.objects.all()
    if season_id is not None:
        p = p.filter(match__season_id=season_id)
    if queue_id is not None:
        p = p.filter(match__queue_id=queue_id)

    if recent is not None:
        m = Match.objects.all()
        if season_id is not None:
            m = m.filter(season_id=season_id)
        if queue_id is not None:
            m = m.filter(queue_id=queue_id)
        m = m.order_by('-game_creation')
        m_id_list = [x.id for x in m[:recent]]

        p = p.filter(match__id__in=m_id_list)

    # get all participants that were in a match with the given summoner
    p = p.filter(match__participants__current_account_id=summoner.account_id)

    # exclude the summoner
    p = p.exclude(current_account_id=summoner.account_id)

    # I could include and `if team` condition, but I am assuming the top
    # values will be the same as the totals
    if not team:
        p = p.exclude(
            team_id=Subquery(
                Participant.objects.filter(match__participants__id=OuterRef('id'), current_account_id=summoner.account_id)
                .values('team_id')[:1]
            )
        )

    p = p.values(group_by).annotate(count=Count(group_by))
    p = p.order_by('-count')

    return p


@task(name='match.tasks.import_advanced_timeline')
def import_advanced_timeline(match_id=None, overwrite=False):
    """

    Parameters
    ----------
    match_id : ID
        Internal Match ID

    Returns
    -------
    None

    """
    match = Match.objects.get(id=match_id)
    try:
        match.advancedtimeline
        if overwrite:
            match.advancedtimeline.delete()
    except:
        # we haven't imported it yet.
        pass
    api = get_riot_api()
    if api:
        region = match.platform_id
        alpha = 'abcdefghijklmnopqrstuvwxyz'
        region = region.lower()
        region = ''.join([x for x in region if x in alpha])
        r = api.match.timeline(match._id, region=region)
        data = r.json()
        frame_interval = data['frameInterval']
        at = AdvancedTimeline(match=match, frame_interval=frame_interval)
        at.save()

        for _frame in data['frames']:
            timestamp = _frame['timestamp']
            frame = Frame(timeline=at, timestamp=timestamp)
            frame.save()
            for i, p_frame in _frame['participantFrames'].items():

                p_frame_data = {
                    'frame': frame,
                    'participant_id': p_frame['participantId'],
                    'current_gold': p_frame['currentGold'],
                    'dominion_score': p_frame.get('dominionScore', None),
                    'jungle_minions_killed': p_frame['jungleMinionsKilled'],
                    'level': p_frame['level'],
                    'minions_killed': p_frame['minionsKilled'],
                }
                participant_frame = ParticipantFrame(**p_frame_data)
                participant_frame.save()
                pos = p_frame.get('position', None)
                if pos is not None:
                    pos_data = {
                        'participantframe': participant_frame,
                        'x': pos['x'],
                        'y': pos['y'],
                        'team_score': pos.get('teamScore', 0),
                        'total_gold': pos.get('totalGold', 0),
                        'xp': pos.get('xp', 0),
                    }
                    position = Position(**pos_data)
                    position.save()

            for _event in _frame['events']:
                participant_id = _event.get('participantId', None)
                if participant_id is None:
                    participant_id = _event.get('creatorId', None)
                pos = _event.get('position', {})
                event_data = {
                    'frame': frame,
                    '_type': _event['type'],
                    'participant_id': participant_id,
                    'timestamp': _event.get('timestamp', None),
                    'item_id': _event.get('itemId', None),
                    'level_up_type': _event.get('levelUpType', None),
                    'skill_slot': _event.get('skillSlot', None),
                    'ward_type': _event.get('wardType', None),
                    'before_id': _event.get('beforeId', None),
                    'after_id': _event.get('afterId', None),
                    'killer_id': _event.get('killerId', None),
                    'victim_id': _event.get('victimId', None),
                    'x': pos.get('x', None),
                    'y': pos.get('y', None),
                    'monster_type': _event.get('monsterType', None),
                    'monster_sub_type': _event.get('monsterSubType', None),
                    'building_type': _event.get('buildingType', None),
                    'lane_type': _event.get('laneType', None),
                    'team_id': _event.get('teamId', None),
                    'tower_type': _event.get('towerType', None),
                }
                event = Event(**event_data)
                event.save()
