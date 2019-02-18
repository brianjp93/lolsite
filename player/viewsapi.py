from rest_framework.response import Response
from rest_framework.decorators import api_view

from data import constants
from player import tasks as pt

from .models import Summoner
from data.models import ProfileIcon, Champion
from match.models import Match, Participant
from match.models import Timeline, Team, Ban

from .serializers import SummonerSerializer
from data.serializers import ProfileIconSerializer
from match.serializers import MatchSerializer, ParticipantSerializer
from match.serializers import TimelineSerializer, TeamSerializer, BanSerializer
from match.serializers import StatsSerializer


@api_view(['POST'])
def get_summoner(request, format=None):
    """

    POST Parameters
    ---------------
    name : str
    account_id : str
    region : str
    update : bool
        Whether or not to check riot for update first

    Returns
    -------
    JSON Summoner Model

    """
    data = {}
    status_code = 200
    if request.method == 'POST':
        name = request.data.get('name', '')
        account_id = request.data.get('account_id', '')
        region = request.data.get('region')
        if name:
            name = ''.join(name.split()).lower()
            query = Summoner.objects.filter(simple_name=name, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        else:
            query = None

        if query and query.exists():
            summoner = query.first()
            serializer = SummonerSerializer(summoner)
            data['data'] = serializer.data
        else:
            data['error'] = 'No summoner found'
            status_code = 400
    return Response(data, status=status_code)


@api_view(['POST'])
def get_summoner_page(request, format=None):
    """Get the basic information needed to render the summoner page.

    POST Parameters
    ---------------
    summoner_name : str
    account_id : str
    region : str
    update : bool
        Whether or not to check riot for update first
    language : str
        default = 'en_US'
    queue_id : str
    page : int
    count : int


    Returns
    -------
    JSON Summoner Page Data

    """
    data = {}
    status_code = 200

    perk_cache = {}
    perk_tree_cache = {}
    item_cache = {}
    spell_cache = {}

    if request.method == 'POST':    
        update = request.data.get('update', False)
        region = request.data.get('region', None)
        name = request.data.get('summoner_name', None)
        account_id = request.data.get('account_id', None)
        language = request.data.get('language', 'en_US')
        queue_id = request.data.get('queue_id', None)
        page = request.data.get('page', 1)
        count = request.data.get('count', 20)
        if count > 100:
            count = 100

        start = (page - 1) * count
        end = page * count

        if name:
            simplified = ''.join(name.strip().split())
            query = Summoner.objects.filter(simple_name=simplified, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)

        if query.exists():
            summoner = query.first()
        else:
            # only update if we're not importing for the first time
            update = False
            pt.import_summoner(region, name=name)
            simplified = ''.join(name.strip().split())
            query = Summoner.objects.filter(simple_name=simplified, region=region)
            if query.exists():
                summoner = query.first()
            else:
                summoner = None
                data = {'error': 'Could not find a summoner in this region with that name.'}
                status_code = 404

        if update:
            pt.import_summoner.delay(region, name=name)

        if summoner:
            # summoner_ser = SummonerSerializer(summoner)
            summoner_data = {
                '_id': summoner._id,
                'id': summoner.id,
                'account_id': summoner.account_id,
                'name': summoner.name,
                'simple_name': summoner.simple_name,
                'profile_icon_id': summoner.profile_icon_id,
                'summoner_level': summoner.summoner_level,
            }

            query = ProfileIcon.objects.filter(_id=summoner.profile_icon_id)
            if query.exists():
                query = query.order_by('-version')
                profile_icon = query.first()
                profile_icon_ser = ProfileIconSerializer(profile_icon)
                profile_icon_data = profile_icon_ser.data
            else:
                profile_icon_data = {}

            matches = []
            match_query = Match.objects.filter(participants__account_id=summoner.account_id)
            if queue_id is not None:
                match_query = match_query.filter(queue_id=queue_id)
            for match in match_query.order_by('-game_creation')[start: end]:
                # match_serializer = MatchSerializer(match)
                match_data = {
                    'id': match.id,
                    '_id': match._id,
                    'game_duration': match.game_duration,
                    'queue_id': match.queue_id,
                }

                participants = []
                for participant in match.participants.all():
                    # participant_ser = ParticipantSerializer(participant)

                    # SPELLS
                    if participant.spell_1_id in spell_cache:
                        spell_1 = spell_cache[participant.spell_1_id]
                    else:
                        spell_cache[participant.spell_1_id] = {'_id': participant.spell_1_id, 'image_url': participant.spell_1_image_url()}
                        spell_1 = spell_cache[participant.spell_1_id]

                    if participant.spell_2_id in spell_cache:
                        spell_2 = spell_cache[participant.spell_2_id]
                    else:
                        spell_cache[participant.spell_2_id] = {'_id': participant.spell_2_id, 'image_url': participant.spell_2_image_url()}
                        spell_2 = spell_cache[participant.spell_2_id]

                    participant_data = {
                        'summoner_name': participant.summoner_name,
                        'account_id': participant.account_id,
                        'lane': participant.lane,
                        'role': participant.role,
                        'team_id': participant.team_id,

                        'spell_1_id': participant.spell_1_id,
                        'spell_1_image_url': spell_1['image_url'],
                        'spell_2_id': participant.spell_2_id,
                        'spell_2_image_url': spell_2['image_url'],
                    }

                    champ_query = Champion.objects.filter(key=participant.champion_id, language='en_US').order_by('-version')
                    if champ_query.exists():
                        champ = champ_query.first()
                        participant_data['champion'] = {
                            '_id': champ._id,
                            'image_url': champ.image_url(),
                            'name': champ.name,
                        }
                    else:
                        participant_data['champion'] = {}

                    participant_data['stats'] = {}
                    # only add stats if it's for the current summoner
                    if participant.account_id == summoner.account_id:
                        try:
                            stats = participant.stats
                        except:
                            pass
                        else:
                            # ITEM 0
                            if stats.item_0 in item_cache:
                                item_0 = item_cache[stats.item_0]
                            else:
                                item_cache[stats.item_0] = {
                                    '_id': stats.item_0,
                                    'image_url': stats.item_0_image_url()
                                }
                                item_0 = item_cache[stats.item_0]

                            # ITEM 1
                            if stats.item_1 in item_cache:
                                item_1 = item_cache[stats.item_1]
                            else:
                                item_cache[stats.item_1] = {
                                    '_id': stats.item_1,
                                    'image_url': stats.item_1_image_url()
                                }
                                item_1 = item_cache[stats.item_1]

                            if stats.item_2 in item_cache:
                                item_2 = item_cache[stats.item_2]
                            else:
                                item_cache[stats.item_2] = {
                                    '_id': stats.item_2,
                                    'image_url': stats.item_2_image_url()
                                }
                                item_2 = item_cache[stats.item_2]

                            if stats.item_3 in item_cache:
                                item_3 = item_cache[stats.item_3]
                            else:
                                item_cache[stats.item_3] = {
                                    '_id': stats.item_3,
                                    'image_url': stats.item_3_image_url()
                                }
                                item_3 = item_cache[stats.item_3]

                            if stats.item_4 in item_cache:
                                item_4 = item_cache[stats.item_4]
                            else:
                                item_cache[stats.item_4] = {
                                    '_id': stats.item_4,
                                    'image_url': stats.item_4_image_url()
                                }
                                item_4 = item_cache[stats.item_4]

                            if stats.item_5 in item_cache:
                                item_5 = item_cache[stats.item_5]
                            else:
                                item_cache[stats.item_5] = {
                                    '_id': stats.item_5,
                                    'image_url': stats.item_5_image_url()
                                }
                                item_5 = item_cache[stats.item_5]

                            if stats.item_6 in item_cache:
                                item_6 = item_cache[stats.item_6]
                            else:
                                item_cache[stats.item_6] = {
                                    '_id': stats.item_6,
                                    'image_url': stats.item_6_image_url()
                                }
                                item_6 = item_cache[stats.item_6]

                            if stats.perk_primary_style in perk_tree_cache:
                                perk_primary_style = perk_tree_cache[stats.perk_primary_style]
                            else:
                                perk_tree_cache[stats.perk_primary_style] = {'_id': stats.perk_primary_style, 'image_url': stats.perk_primary_style_image_url()}
                                perk_primary_style = perk_tree_cache[stats.perk_primary_style]

                            if stats.perk_sub_style in perk_tree_cache:
                                perk_sub_style = perk_tree_cache[stats.perk_sub_style]
                            else:
                                perk_tree_cache[stats.perk_sub_style] = {'_id': stats.perk_sub_style, 'image_url': stats.perk_sub_style_image_url()}
                                perk_sub_style = perk_tree_cache[stats.perk_sub_style]

                            if stats.perk_0 in perk_cache:
                                perk_0 = perk_cache[stats.perk_0]
                            else:
                                perk_cache[stats.perk_0] = {'_id': stats.perk_0, 'image_url': stats.perk_0_image_url()}
                                perk_0 = perk_cache[stats.perk_0]

                            stats_data = {
                                'item_0': stats.item_0,
                                'item_0_image_url': item_0['image_url'],
                                'item_1': stats.item_1,
                                'item_1_image_url': item_1['image_url'],
                                'item_2': stats.item_2,
                                'item_2_image_url': item_2['image_url'],
                                'item_3': stats.item_3,
                                'item_3_image_url': item_3['image_url'],
                                'item_4': stats.item_4,
                                'item_4_image_url': item_4['image_url'],
                                'item_5': stats.item_5,
                                'item_5_image_url': item_5['image_url'],
                                'item_6': stats.item_6,
                                'item_6_image_url': item_6['image_url'],
                                'perk_primary_style': stats.perk_primary_style,
                                'perk_primary_style_image_url': perk_primary_style['image_url'],
                                'perk_sub_style': stats.perk_sub_style,
                                'perk_sub_style_image_url': perk_sub_style['image_url'],
                                'perk_0': stats.perk_0,
                                'perk_0_image_url': perk_0['image_url'],

                                'kills': stats.kills,
                                'deaths': stats.deaths,
                                'assists': stats.assists,

                                'gold_earned': stats.gold_earned,
                                'champ_level': stats.champ_level,
                                'total_damage_dealt_to_champions': stats.total_damage_dealt_to_champions,
                            }
                            participant_data['stats'] = stats_data

                    participants.append(participant_data)
                match_data['participants'] = participants

                teams = []
                for team in match.teams.all():
                    # team_ser = TeamSerializer(team)
                    team_data = {
                        'win_str': team.win_str,
                        '_id': team._id,
                    }
                    # team_data['bans'] = []
                    # for ban in team.bans.all():
                    #     ban_ser = BanSerializer(ban)
                    #     ban_data = ban_ser.data
                    #     team_data['bans'].append(ban_data)

                    teams.append(team_data)
                match_data['teams'] = teams

                matches.append(match_data)

        data = {
            'matches': matches,
            'profile_icon': profile_icon_data,
            'summoner': summoner_data,
        }

    return Response(data, status=status_code)
