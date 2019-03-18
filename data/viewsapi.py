from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import ProfileIcon, ReforgedRune, ReforgedTree
from match.models import Match, Participant, Stats
from match.models import Timeline, Team, Ban, Item

from .serializers import ProfileIconSerializer, ItemSerializer
from .serializers import ItemGoldSerializer, ItemStatSerializer
from .serializers import ReforgedRuneSerializer


def get_summoner_page(request, format=None):
    """Get all data needed to render the basic summoner page.

    POST Parameters
    ---------------
    summoner_name : str
    region : str

    Returns
    -------
    JSON Data

    """
    pass


@api_view(['POST'])
def get_profile_icon(request, format=None):
    """

    POST Parameters
    ---------------
    profile_icon_id : str
    language : str

    Returns
    -------
    JSON Profile Icon Model

    """
    data = {}
    status_code = 200

    profile_icon_id = request.data.get('profile_icon_id', None)
    language = request.data.get('language', None)

    if request.method == 'POST':
        query = ProfileIcon.objects.filter(_id=profile_icon_id)
        if query.exists():
            query = query.order_by('-version')
            profile_icon = query.first()
            serializer = ProfileIconSerializer(profile_icon)
            data['data'] = serializer.data
        else:
            data['error'] = "Couldn't find a ProfileIcon with the id given."
            status_code = 404
    return Response(data, status=status_code)


@api_view(['POST'])
def get_item(request, format=None):
    """

    POST Parameters
    ---------------
    item_id : int
    major : int
        major version - 9.4.1 => 9
    minor : int
        minor version - 9.4.1 => 4

    Returns
    -------
    Item JSON

    """
    data = {}
    status_code = 200

    item_id = request.data['item_id']
    major = request.data['major']
    minor = request.data['minor']

    version = f'{major}.{minor}.1'
    query = Item.objects.filter(_id=item_id, version=version)
    if query.exists():
        item = query.first()
        item_data = ItemSerializer(item).data
        item_data['stats'] = []
        for stat in item.stats.all():
            stat_data = ItemStatSerializer(stat).data
            item_data['stats'].append(stat_data)
        item_data['gold'] = {}
        try:
            item_gold_data = ItemGoldSerializer(item.gold).data
            item_data['gold'] = item_gold_data
        except:
            pass
        data['data'] = item_data
    else:
        status_code = 404
        data = {'message': 'Item not found.'}

    return Response(data, status=status_code)


@api_view(['POST'])
def get_reforged_runes(request, format=None):
    """Get Reforged Rune data.

    POST Parameters
    ---------------
    version : str
        eg: 9.5.1

    Returns
    -------
    Runes Data JSON

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        version = request.data.get('version', None)
        if version is None:
            pass
            # get newest version of runes
            tree = ReforgedTree.objects.all().order_by('-version').first()
            version = tree.version
        runes = ReforgedRune.objects.filter(reforgedtree__version=version)
        runes_data = ReforgedRuneSerializer(runes, many=True).data
        data = {'data': runes_data}

    return Response(data, status=status_code)
