from rest_framework.response import Response
from rest_framework.decorators import api_view

from data import constants
from player import tasks as pt

from .models import Summoner
from data.models import ProfileIcon
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
                    participant_data = {
                        'summoner_name': participant.summoner_name,
                        'account_id': participant.account_id,
                        'spell_1_id': participant.spell_1_id,
                        'spell_2_id': participant.spell_2_id,
                        'lane': participant.lane,
                        'role': participant.role,
                        'team_id': participant.team_id,
                    }

                    participant_data['stats'] = {}
                    # only add stats if it's for the current summoner
                    if participant.account_id == summoner.account_id:
                        try:
                            stats = participant.stats
                            stats_data = {
                                'item_0': stats.item_0,
                                'item_1': stats.item_1, 
                                'item_2': stats.item_2,
                                'item_3': stats.item_3,
                                'item_4': stats.item_4,
                                'item_5': stats.item_5,
                                'item_6': stats.item_6,
                            }
                            participant_data['stats'] = stats_data
                        except:
                            pass

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
