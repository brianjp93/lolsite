from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Exists, OuterRef
from django.http import Http404, HttpRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_control
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import exceptions
from rest_framework.generics import ListAPIView, RetrieveAPIView

from data import constants

from .models import ItemMap, ReforgedRune, ReforgedTree
from .models import Champion, Item

from match.models import Match

from .serializers import ItemSerializer, SimpleItemSerializer
from .serializers import ReforgedRuneSerializer, ChampionSerializer
from .serializers import ChampionSpellSerializer, BasicChampionWithImageSerializer

from lolsite.helpers import query_debugger, LargeResultsSetPagination
from django.core.cache import cache
from django.conf import settings
import logging


logger = logging.getLogger(__name__)


@api_view(["POST"])
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

    item_id = request.data.get("item_id", None)
    item_list = request.data.get("item_list", None)
    major = request.data.get("major")
    minor = request.data.get("minor")

    if None in [major, minor]:
        item = Item.objects.all().order_by("-major", "-minor", "-patch").first()
        if not item:
            raise exceptions.NotFound('Item not found.')
        version = item.version
    else:
        version = f"{major}.{minor}.1"

    if item_id:
        if item := Item.objects.filter(_id=item_id, version=version).first():
            item_data = ItemSerializer(item).data
            data["data"] = item_data
        else:
            item = (
                Item.objects.filter(_id=item_id)
                .order_by("-major", "-minor", "-patch")
                .first()
            )
            item_data = ItemSerializer(item).data
            data["data"] = item_data
    elif item_list:
        query = Item.objects.filter(_id__in=item_list, version=version)

        serialized_items = []

        if not query.exists():
            item = Item.objects.all().order_by("-major", "-minor", "-patch").first()
            if not item:
                raise exceptions.NotFound('Item not found.')
            query = Item.objects.filter(_id__in=item_list, version=item.version)

        serialized_items = ItemSerializer(query, many=True).data
        data["data"] = serialized_items

    return Response(data, status=status_code)


class SimpleItemRetrieveView(RetrieveAPIView):
    queryset = Item.objects.all().select_related('image', 'gold')
    serializer_class = SimpleItemSerializer

    @method_decorator(cache_control(max_age=3600))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        qs = self.get_queryset()
        _id = self.kwargs['_id']
        major = self.kwargs['major']
        minor = self.kwargs['minor']
        try:
            return qs.get(_id=_id, major=major, minor=minor)
        except ObjectDoesNotExist:
            pass

        if item := qs.filter(_id=_id).order_by('-major', '-minor').first():
            return item

        raise Http404


class SimpleItemListView(ListAPIView):
    serializer_class = SimpleItemSerializer
    pagination_class = LargeResultsSetPagination

    @method_decorator(cache_control(max_age=3600))
    def get(self, request, *args, **kwargs) -> Response:
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Item.objects.all().select_related('image', 'gold')
        ids = self.request.query_params.get('ids', None)
        major = self.kwargs['major']
        minor = self.kwargs['minor']
        qs = qs.filter(major=major, minor=minor)
        if ids:
            qs = qs.filter(_id__in=ids)
        return qs


@api_view(['GET'])
def get_item_history(request, _id, format=None):
    """Get the stat history of an item.
    """
    item = Item.objects.filter(_id=_id).order_by('_id', '-major', '-minor').distinct('_id').first()
    if item is None:
        raise exceptions.NotFound(f'Could not find item with id {_id}')
    item_history = []
    while item:
        version = item.last_changed
        if version and version != item.version:
            item = Item.objects.get(_id=_id, version=version)
            item_history.append(item)
        else:
            break
    qs = Item.objects.filter(_id=_id, major__lte=item.major, minor__lte=item.minor).order_by(
        '-major', '-minor',
    )
    if qs.count() > 1:
        item = qs[1]
        item_history.append(item)
    data = ItemSerializer(item_history, many=True).data
    return Response(data)


@api_view(["GET"])
def all_items(request, format=None):
    data = {}
    status_code = 200
    # 120 minute cache

    major = request.query_params.get("major", None)
    minor = request.query_params.get("minor", None)
    patch = request.query_params.get("patch", None)
    map_id = request.query_params.get("map_id", None)

    if patch is not None:
        version = patch
    elif None in [major, minor]:
        item = Item.objects.all().order_by("-major", "-minor").first()
        if not item:
            raise exceptions.NotFound('Item not found.')
        major = item.major
        minor = item.minor
        version = f"{major}.{minor}.1"
    else:
        version = f"{major}.{minor}.1"

    logger.info(f"Filtering for items in {version=}")

    query = Item.objects.filter(version=version)
    if map_id is not None:
        query = query.filter(
            Exists(ItemMap.objects.filter(item=OuterRef('id'), key=map_id, value=True))
        )
    items = ItemSerializer(query, many=True).data
    if items:
        data = {"data": items, "version": version}
    else:
        status_code = 404
        data = {"message": "No items found for the version given."}

    return Response(data, status=status_code)


@api_view(["POST"])
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

    if request.method == "POST":
        version = request.data.get("version", None)
        cache_key = f"reforgedrunes/{version}"
        cache_data = cache.get(cache_key)
        if cache_data:
            data = cache_data["data"]
            status_code = cache_data["status"]
        else:
            SET_CACHE = True
            if version is None:
                SET_CACHE = False
                # get newest version of runes
                tree = (
                    ReforgedTree.objects.all()
                    .order_by("-major", "-minor", "-patch")
                    .first()
                )
                if not tree:
                    raise exceptions.NotFound()
                version = tree.version
                runes = ReforgedRune.objects.filter(reforgedtree__version=version)
            else:
                runes = ReforgedRune.objects.filter(reforgedtree__version=version)
                if not runes.exists():
                    SET_CACHE = False
                    # get newest version of runes
                    tree = (
                        ReforgedTree.objects.all()
                        .order_by("-major", "-minor", "-patch")
                        .first()
                    )
                    if not tree:
                        raise exceptions.NotFound()
                    version = tree.version
                    runes = ReforgedRune.objects.filter(reforgedtree__version=version)
            runes_data = ReforgedRuneSerializer(runes, many=True)
            data = {"data": runes_data.data, "version": version}

            # only cache if we actually have data
            if data and SET_CACHE:
                new_cache = {"data": data, "status": status_code}
                cache.set(cache_key, new_cache, cache_seconds)

    return Response(data, status=status_code)


@api_view(["POST"])
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

    if request.method == "POST":
        match = Match.objects.all().order_by("-major", "-minor").first()
        if not match:
            raise exceptions.NotFound()
        version_data = {
            "game_version": match.game_version,
            "major": match.major,
            "minor": match.minor,
            "patch": match.patch,
            "build": match.build,
        }
        data = {"data": version_data}

    return Response(data, status=status_code)


@api_view(["POST"])
def get_champions(request, format=None):
    """Get champion data

    POST Parameters
    ---------------
    champions : list
        All champions will be serialized if not provided.
    version : str
        get extra data - stats
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
    cache_seconds = 60 * 60 * 10

    if request.method == "POST":
        champions = request.data.get("champions", [])
        fields = request.data.get("fields", [])
        order_by = request.data.get("order_by", None)
        version = request.data.get("version", None)
        if not version:
            top = Champion.objects.all().order_by("-major", "-minor", "-patch").first()
            if not top:
                raise exceptions.NotFound()
            version = top.version

        cache_key = None
        cache_data = None
        fields_string = ",".join(fields)
        if len(champions) == 0:
            cache_key = f"{version}/{order_by}/{fields_string}"
            cache_data = cache.get(cache_key)

        # CACHING
        if cache_key and cache_data:
            data = cache_data
        else:
            query = Champion.objects.filter(version=version)
            if champions:
                query = query.filter(key__in=champions)

            if order_by:
                query = query.order_by(order_by)
            champion_data = ChampionSerializer(query, many=True, fields=fields).data
            data = {"data": champion_data}
            if len(champion_data) > 0 and cache_key:
                cache.set(cache_key, data, cache_seconds)
    else:
        data = {"message": "Must use POST."}

    return Response(data, status=status_code)


class BasicChampionView(ListAPIView):
    serializer_class = BasicChampionWithImageSerializer
    pagination_class = LargeResultsSetPagination

    def get_queryset(self):
        if champ := Champion.objects.all().order_by('-major', '-minor', '-patch').first():
            return Champion.objects.filter(
                major=champ.major,
                minor=champ.minor,
                patch=champ.patch
            ).distinct('key').select_related('image')
        return Champion.objects.none()


@api_view(["POST"])
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

    if request.method == "POST":
        champion_id = request.data["champion_id"]
        query = Champion.objects.all().order_by("-major", "-minor", "-patch")
        query = query.filter(_id=champion_id)
        if champion := query.first():
            spells = champion.spells.all().order_by("id")
            data["data"] = ChampionSpellSerializer(spells, many=True).data
        else:
            data["data"] = []
            data["message"] = "Could not find champion."
            status_code = 404
    else:
        data = {"message": "Must use POST."}
    return Response(data, status=status_code)


@api_view(['GET'])
def get_item_diff(request: HttpRequest, item_id: int, format=None):
    qs = Item.objects.filter(_id=item_id, diff__isnull=False).order_by('-major', '-minor', '-patch')
    data = ItemSerializer(qs, many=True).data
    return Response(data)


@api_view(['GET'])
def get_static_url(request: HttpRequest, format=None):
    uri = request.build_absolute_uri()
    print(uri)
    return Response(settings.STATIC_URL)


@api_view(['GET'])
def get_media_url(request, format=None):
    uri = request.build_absolute_uri()
    print(uri)
    return Response(settings.MEDIA_URL)


@api_view(['GET'])
def get_queues(request, format=None):
    return Response(constants.QUEUES)


@api_view(['GET'])
def get_google_recaptcha_site_key(request, format=None):
    return Response(settings.GOOGLE_RECAPTCHA_KEY)
