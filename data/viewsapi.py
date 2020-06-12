from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import ProfileIcon, ReforgedRune, ReforgedTree
from .models import Champion

from match.models import Match, Item

from .serializers import ProfileIconSerializer, ItemSerializer
from .serializers import ItemGoldSerializer, ItemStatSerializer
from .serializers import ReforgedRuneSerializer, ChampionSerializer
from .serializers import ChampionSpellSerializer

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
    # language = request.data.get('language', None)

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
    item_list : [int]
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

    item_id = request.data.get('item_id', None)
    item_list = request.data.get('item_list', None)
    major = request.data.get('major')
    minor = request.data.get('minor')

    if None in [major, minor]:
        item = Item.objects.all().order_by('-major', '-minor').first()
        major = item.major
        minor = item.minor
    version = f'{major}.{minor}.1'

    if item_id:
        query = Item.objects.filter(_id=item_id, version=version)
        if query.exists():
            item = query.first()
            item_data = serialize_item(item)
            data['data'] = item_data
        else:
            item = Item.objects.filter(_id=item_id).order_by('-major', '-minor').first()
            item_data = serialize_item(item)
            data['data'] = item_data
    elif item_list:
        query = Item.objects.filter(_id__in=item_list, version=version)
        serialized_items = []
        for item in query:
            item_data = serialize_item(item)
            serialized_items.append(item_data)
        data['data'] = serialized_items

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

    major = request.data.get('major', None)
    minor = request.data.get('minor', None)

    if None in [major, minor]:
        item = Item.objects.all().order_by('-major', '-minor').first()
        major = item.major
        minor = item.minor
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
            SET_CACHE = True
            if version is None:
                SET_CACHE = False
                # get newest version of runes
                tree = ReforgedTree.objects.all().order_by('-version').first()
                version = tree.version
                runes = ReforgedRune.objects.filter(reforgedtree__version=version)
            else:
                runes = ReforgedRune.objects.filter(reforgedtree__version=version)
                if not runes.exists():
                    SET_CACHE = False
                    # get newest version of runes
                    tree = ReforgedTree.objects.all().order_by('-version').first()
                    version = tree.version
                    runes = ReforgedRune.objects.filter(reforgedtree__version=version)
            runes_data = ReforgedRuneSerializer(runes, many=True)
            data = {'data': runes_data.data, 'version': version}

            # only cache if we actually have data
            if data and SET_CACHE:
                new_cache = {'data': data, 'status': status_code}
                cache.set(cache_key, new_cache, cache_seconds)

    return Response(data, status=status_code)


@api_view(['POST'])
def get_current_season(request, format=None):
    """Get current season patch data.

    Parameters
    ----------
    None

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        match = Match.objects.all().order_by('-major', '-minor').first()
        version_data = {
            'game_version': match.game_version,
            'major': match.major,
            'minor': match.minor,
            'patch': match.patch,
            'build': match.build,
        }
        data = {'data': version_data}

    return Response(data, status=status_code)


@api_view(['POST'])
def get_champions(request, format=None):
    """Get champion data

    POST Parameters
    ---------------
    champions : list
        All champions will be serialized if not provided.
    fields : list
        A list of fields you want returned in the serialized
        champion data.
    order_by : str

    Returns
    -------
    JSON

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        champions = request.data.get('champions', [])
        fields = request.data.get('fields', None)
        order_by = request.data.get('order_by', None)

        top = Champion.objects.all().order_by('-major', '-minor', '-patch').first()
        version = top.version

        query = Champion.objects.filter(version=version)
        if champions:
            query = query.filter(key__in=champions)

        if order_by:
            query = query.order_by(order_by)
        champion_data = ChampionSerializer(query, many=True, fields=fields).data
        data = {'data': champion_data}
    else:
        data = {'message': 'Must use POST.'}

    return Response(data, status=status_code)


@api_view(['POST'])
def get_champion_spells(request, format=None):
    """

    POST Parameters
    ---------------
    champion_id : int
    major : int
    minor : int

    Returns
    -------
    JSON Response

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        champion_id = request.data['champion_id']
        query = Champion.objects.all().order_by('-major', '-minor', '-patch')
        query = query.filter(_id=champion_id)
        if query.exists():
            champion = query.first()
            spells = champion.spells.all().order_by('id')
            data['data'] = ChampionSpellSerializer(spells, many=True).data
        else:
            data['data'] = []
            data['message'] = 'Could not find champion.'
            status_code = 404
    else:
        data = {'message': 'Must use POST.'}
    return Response(data, status=status_code)

