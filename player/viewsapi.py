"""player.viewsapi
"""
# pylint: disable=W0613, W0622, W0212, bare-except, broad-except


from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import authenticate, login

from player import tasks as pt
from player.models import EmailVerification

from data.models import ProfileIcon, Champion
from data.serializers import ProfileIconSerializer

from match import tasks as mt
from match.models import Match

from match.models import sort_positions

from .models import Summoner
from .serializers import SummonerSerializer
from .serializers import RankPositionSerializer


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
            name = pt.simplify(name)
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


def match_filter(request, account_id=None):
    """Helper function for other views.

    Parameters
    ----------
    request : Request
    account_id : str
        Include this arg to avoid making a database call

    POST Parameters
    ---------------
    with_names : [str]

    Returns
    -------
    Match QuerySet

    """
    region = request.data.get('region', None)
    name = request.data.get('summoner_name', None)
    account_id = request.data.get('account_id', None)
    queue_in = request.data.get('queue_in', [])
    queue = request.data.get('queue', None)
    with_names = request.data.get('with_names', [])

    if account_id is None:
        if name:
            simplified = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=simplified, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        summoner = query.first()
        account_id = summoner.account_id

    matches = Match.objects.filter(participants__current_account_id=account_id)
    if queue_in:
        matches = matches.filter(queue_id__in=queue_in)
    if queue:
        matches = matches.filter(queue_id=queue)

    # get matches with common players
    if with_names:
        with_account_ids = set()
        for name in with_names:
            name = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=name)
            if query.exists():
                friend = query.first()
                with_account_ids.add(friend.account_id)
            else:
                pt.import_summoner(region, name)
                query = Summoner.objects.filter(simple_name=name)
                if query.exists():
                    friend = query.first()
                    with_account_ids.add(friend.account_id)
        matches = matches.filter(participants__current_account_id__in=with_account_ids)
    return matches


def serialize_matches(match_query, account_id): # pylint: disable=too-many-statements, too-many-branches
    """Precise serializer for a match_query.

    Parameters
    ----------
    match_query : Match QuerySet
    account_id : str

    Returns
    -------
    Serialized Match List

    """
    perk_cache = {}
    perk_tree_cache = {}
    item_cache = {}
    spell_cache = {}

    matches = []
    match_query = match_query.prefetch_related('participants', 'teams', 'participants__stats')
    for match in match_query:
        # match_serializer = MatchSerializer(match)
        cache_key = f'account/{account_id}/match/{match._id}'
        cached = cache.get(cache_key)
        if cached:
            matches.append(cached)
        else:
            match_data = {
                'id': match.id,
                '_id': match._id,
                'game_duration': match.game_duration,
                'game_creation': match.game_creation,
                'queue_id': match.queue_id,
                'major': match.major,
                'minor': match.minor,
                'tier_average': match.tier_average(),
            }

            participants = []
            for participant in match.participants.all():
                # participant_ser = ParticipantSerializer(participant)

                # SPELLS
                if participant.spell_1_id in spell_cache:
                    spell_1 = spell_cache[participant.spell_1_id]
                else:
                    spell_cache[participant.spell_1_id] = {
                        '_id': participant.spell_1_id,
                        'image_url': participant.spell_1_image_url()
                    }
                    spell_1 = spell_cache[participant.spell_1_id]

                if participant.spell_2_id in spell_cache:
                    spell_2 = spell_cache[participant.spell_2_id]
                else:
                    spell_cache[participant.spell_2_id] = {
                        '_id': participant.spell_2_id,
                        'image_url': participant.spell_2_image_url()
                    }
                    spell_2 = spell_cache[participant.spell_2_id]

                participant_data = {
                    '_id': participant._id,
                    'summoner_name': participant.summoner_name,
                    'account_id': participant.current_account_id,
                    'lane': participant.lane,
                    'role': participant.role,
                    'team_id': participant.team_id,

                    'spell_1_id': participant.spell_1_id,
                    'spell_1_image_url': spell_1['image_url'],
                    'spell_2_id': participant.spell_2_id,
                    'spell_2_image_url': spell_2['image_url'],
                }

                champ_query = Champion.objects.filter(
                    key=participant.champion_id, language='en_US'
                ).order_by('-version')
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
                if participant.current_account_id == account_id:
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
                            perk_tree_cache[stats.perk_primary_style] = {
                                '_id': stats.perk_primary_style,
                                'image_url': stats.perk_primary_style_image_url()
                            }
                            perk_primary_style = perk_tree_cache[stats.perk_primary_style]

                        if stats.perk_sub_style in perk_tree_cache:
                            perk_sub_style = perk_tree_cache[stats.perk_sub_style]
                        else:
                            perk_tree_cache[stats.perk_sub_style] = {
                                '_id': stats.perk_sub_style,
                                'image_url': stats.perk_sub_style_image_url()
                            }
                            perk_sub_style = perk_tree_cache[stats.perk_sub_style]

                        if stats.perk_0 in perk_cache:
                            perk_0 = perk_cache[stats.perk_0]
                        else:
                            perk_cache[stats.perk_0] = {
                                '_id': stats.perk_0,
                                'image_url': stats.perk_0_image_url()
                            }
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
                            'perk_0_var_1': stats.perk_0_var_1,
                            'perk_0_var_2': stats.perk_0_var_2,
                            'perk_0_var_3': stats.perk_0_var_3,

                            'kills': stats.kills,
                            'deaths': stats.deaths,
                            'assists': stats.assists,

                            'gold_earned': stats.gold_earned,
                            'champ_level': stats.champ_level,
                            'total_damage_dealt_to_champions': stats.total_damage_dealt_to_champions,
                            'vision_score': stats.vision_score,
                            'total_damage_taken': stats.total_damage_taken,
                            'damage_dealt_to_objectives': stats.damage_dealt_to_objectives,
                            'damage_dealt_to_turrets': stats.damage_dealt_to_turrets,
                            'total_minions_killed': stats.total_minions_killed,
                            'neutral_minions_killed': stats.neutral_minions_killed,
                        }
                        participant_data['stats'] = stats_data
                else:
                    # general data for all participants
                    try:
                        stats = participant.stats
                    except:
                        pass
                    else:
                        stats_data = {
                            'kills': stats.kills,
                            'deaths': stats.deaths,
                            'assists': stats.assists,
                            'champ_level': stats.champ_level,
                            'total_damage_dealt_to_champions': stats.total_damage_dealt_to_champions,
                            'vision_score': stats.vision_score,
                            'total_damage_taken': stats.total_damage_taken,
                            'damage_dealt_to_objectives': stats.damage_dealt_to_objectives,
                            'damage_dealt_to_turrets': stats.damage_dealt_to_turrets,
                            'gold_earned': stats.gold_earned,
                        }
                        participant_data['stats'] = stats_data
                participants.append(participant_data)

            # SORT PARTICIPANTS SO THAT LANES MATCH UP (imperfect)
            participants.sort(key=participant_sort)

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
            cache.set(cache_key, match_data, None)
    return matches


@api_view(['POST'])
def get_summoner_page(request, format=None):
    """Get the basic information needed to render the summoner page.

    POST Parameters
    ---------------
    id : int
        Internal Summoner ID
    summoner_name : str
    account_id : str
    region : str
    update : bool
        Whether or not to check riot for update first
    language : str
        default = 'en_US'
    queue : int
    with_names : [str]
        Get games that include these summoner names.
    page : int
    count : int
    trigger_import : bool
        Whether or not to check for new games
        Even if this is true, it may not check.
    after_index : int
        import matches after this index

    Returns
    -------
    JSON Summoner Page Data

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        _id = request.data.get('id', None)
        update = request.data.get('update', False)
        region = request.data.get('region', None)
        name = request.data.get('summoner_name', None)
        account_id = request.data.get('account_id', None)
        language = request.data.get('language', 'en_US')
        queue = request.data.get('queue', None)
        page = request.data.get('page', 1)
        count = request.data.get('count', 20)
        order_by = request.data.get('order_by', '-game_creation')
        trigger_import = request.data.get('trigger_import', False)
        after_index = request.data.get('after_index', None)
        if count > 100:
            count = 100

        if name:
            simplified = pt.simplify(name)
            query = Summoner.objects.filter(simple_name=simplified, region=region)
        elif account_id:
            query = Summoner.objects.filter(account_id=account_id, region=region)
        elif _id:
            query = Summoner.objects.filter(id=_id, region=region)

        if query.exists():
            summoner = query.first()
        else:
            # only update if we're not importing for the first time
            update = False
            try:
                r = pt.import_summoner(region, name=name)
            except Exception as error:
                print(error)
                data = {'message': 'The summoner could not be found.'}
                status_code = 404
                summoner = None
            else:
                simplified = pt.simplify(name)
                query = Summoner.objects.filter(simple_name=simplified, region=region)
                if query.exists():
                    summoner = query.first()
                else:
                    summoner = None
                    data = {'error': 'Could not find a summoner in this region with that name.'}
                    status_code = 404

        if update:
            # enable delay when celery is working
            # pt.import_summoner.delay(region, name=name)
            summoner__id = pt.import_summoner(region, name=name)
            summoner = Summoner.objects.get(id=summoner__id)

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

            rankcheckpoint = summoner.get_newest_rank_checkpoint()
            if rankcheckpoint:
                rank_positions = RankPositionSerializer(
                    rankcheckpoint.positions.all(), many=True
                ).data
                rank_positions = sort_positions(rank_positions)
            else:
                rank_positions = []

            query = ProfileIcon.objects.filter(_id=summoner.profile_icon_id)
            if query.exists():
                query = query.order_by('-version')
                profile_icon = query.first()
                profile_icon_ser = ProfileIconSerializer(profile_icon)
                profile_icon_data = profile_icon_ser.data
            else:
                profile_icon_data = {}

            # check for new games
            if trigger_import:
                kwargs = {}
                start_index = 0
                if queue is not None:
                    kwargs['queue'] = queue
                if after_index is not None:
                    start_index = after_index
                end_index = start_index + count
                mt.import_recent_matches(
                    start_index, end_index,
                    summoner.account_id, region,
                    **kwargs
                )
                if queue is None and after_index in [None, 0]:
                    summoner.last_summoner_page_import = timezone.now()
                    summoner.save()

            match_query = match_filter(
                request,
                account_id=summoner.account_id
            )
            match_count = match_query.count()

            start = (page - 1) * count
            end = page * count
            match_query = match_query.order_by(order_by)
            match_query = match_query[start: end]
            matches = serialize_matches(match_query, summoner.account_id)

            data = {
                'matches': matches,
                'match_count': match_count,
                'profile_icon': profile_icon_data,
                'summoner': summoner_data,
                'positions': rank_positions,
            }

    return Response(data, status=status_code)

def participant_sort(part):
    """assign values to roles to help sorting

    Parameters
    ----------
    part : dict

    Returns
    -------
    int

    """
    out = 0
    if part['lane'] == 'TOP':
        out = 0
    elif part['lane'] == 'JUNGLE':
        out = 5
    elif part['lane'] == 'MIDDLE':
        out = 10
    elif part['lane'] == 'BOTTOM':
        if part['role'] == 'DUO_CARRY':
            out = 15
        elif part['role'] == 'DUO_SUPPORT':
            out = 16
        else:
            out = 15
    return out


@api_view(['POST'])
def get_positions(request, format=None):
    """Get a player's positional ranks.

    Parameters
    ----------
    summoner_id : str
    region : str
    update : bool [true by default]
        Whether or not to try to create a new RankCheckpoint

    Returns
    -------
    JSON Riot Response Data

    """
    data = {}
    status_code = 200
    summoner_id = request.data['summoner_id']
    region = request.data['region']
    summoner = Summoner.objects.get(_id=summoner_id, region=region)
    if request.data.get('update', True) is True:
        pt.import_positions(summoner.id)

    summoner.refresh_from_db()
    rankcheckpoint = summoner.get_newest_rank_checkpoint()
    if rankcheckpoint:
        try:
            positions = rankcheckpoint.positions.all()
            pos_data = RankPositionSerializer(positions, many=True).data
            # pos_data.sort(key=lambda x: (tier_sort(x), rank_sort(x), lp_sort(x)))
            pos_data = sort_positions(pos_data)
            data = {'data': pos_data}
            status_code = 200
        except Exception as error:
            print(error)
            data = {'data': []}
            status_code = 200
    else:
        data = {'data': []}
        status_code = 200

    return Response(data, status=status_code)


@api_view(['POST'])
def sign_up(request, format=None):
    """Create an account.

    POST Parameters
    ---------------
    email : str
    password : str

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        if request.user.is_authenticated:
            data = {'message': 'You are already logged in.'}
            status_code = 403
        else:
            email = request.data.get('email')
            password = request.data.get('password')

            user = pt.create_account(email, password)
            if user:
                data = {'message': 'Account created.'}
            else:
                data = {'message': 'The email or password was invalid.'}
                status_code = 403
    else:
        data = {'message': 'This resource only supports POSTs.'}

    return Response(data, status=status_code)


@api_view(['POST'])
def verify_email(request, format=None):
    """Verify a User's email.

    * Also calls player.tasks.remove_old_email_verification to delete
        old EmailVerification models.

    POST Parameters
    ---------------
    code : str
        uuid string

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200
    age_hours = 1
    
    if request.method == 'POST':
        code = request.data.get('code')
        verified = pt.verify_user_email(code, age_hours=age_hours)
        if verified:
            data = {'message': 'Successfully verified email.'}
        else:
            data = {
                'message': (
                    'Either the code does not exist, or it is ',
                    'too old.  Request a new verification email.'
                )
            }
            status_code = 404
        pt.remove_old_email_verification(age_hours=age_hours)
    else:
        data = {'message': 'This resource on supports POSTs.'}

    return Response(data, status=status_code)
