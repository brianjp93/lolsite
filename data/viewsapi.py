from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import ProfileIcon, ReforgedRune, ReforgedTree
from match.models import Match, Participant, Stats
from match.models import Timeline, Team, Ban, Item

from .serializers import ProfileIconSerializer, ItemSerializer
from .serializers import ItemGoldSerializer, ItemStatSerializer
from .serializers import ReforgedRuneSerializer

from django.core.cache import cache


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


def serialize_item(item):
    """Serialize and Item model

    Parameters
    ----------
    Item

    Returns
    -------
    dict

    """
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
    return item_data

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
    # 120 minute cache
    cache_seconds = 60 * 120

    item_id = request.data['item_id']
    major = request.data['major']
    minor = request.data['minor']

    version = f'{major}.{minor}.1'
    query = Item.objects.filter(_id=item_id, version=version)
    if query.exists():
        item = query.first()
        item_data = serialize_item(item)
        data['data'] = item_data
    else:
        status_code = 404
        data = {'message': 'Item not found.'}

    return Response(data, status=status_code)


@api_view(['POST'])
def all_items(request, format=None):
    """Get all items for a version.

    USING CACHE

    POST Parameters
    ---------------
    major : int
        Version - major
    minor : int
        Version - minor

    Returns
    -------
    JSON String

    """
    data = {}
    status_code = 200
    # 120 minute cache
    cache_seconds = 60 * 120

    major = request.data['major']
    minor = request.data['minor']

    version = f'{major}.{minor}.1'

    cache_key = f'items/{version}'
    cache_data = cache.get(cache_key)
    if cache_data:
        data = cache_data
    else:
        query = Item.objects.filter(version=version)
        if query.exists():
            items = []
            for item in query:
                item_data = serialize_item(item)
                items.append(item_data)
            cache.set(cache_key, items, cache_seconds)
            data = {'data': items, 'version': version}
        else:
            status_code = 404
            data = {'message': 'No items found for the version given.'}

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
    cache_seconds = 60 * 120

    if request.method == 'POST':
        version = request.data.get('version', None)
        cache_key = f'reforgedrunes/{version}'
        cache_data = cache.get(cache_key)
        if cache_data:
            data = cache_data['data']
            status_code = cache_data['status']
        else:
            if version is None:
                pass
                # get newest version of runes
                tree = ReforgedTree.objects.all().order_by('-version').first()
                version = tree.version
            runes = ReforgedRune.objects.filter(reforgedtree__version=version)
            runes_data = ReforgedRuneSerializer(runes, many=True).data
            data = {'data': runes_data, 'version': version}

            new_cache = {'data': data, 'status': status_code}
            cache.set(cache_key, new_cache, cache_seconds)

    return Response(data, status=status_code)
