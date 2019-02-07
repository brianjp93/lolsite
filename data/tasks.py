"""
"""
from .models import Season, Map, Queue
from .models import GameMode, GameType
from .models import ReforgedTree, ReforgedRune

from .models import Item, ItemEffect, FromItem, IntoItem
from .models import ItemGold, ItemImage, ItemMap, ItemStat
from .models import ItemTag, ItemRune

from django.db.utils import IntegrityError

from . import constants
from match.tasks import get_riot_api


def import_all():
    """Import all constants data from constants.py

    Adds data to database

    Returns
    -------
    None

    """
    import_seasons()
    import_maps()
    import_queues()
    import_gamemodes()
    import_gametypes()


def import_seasons():
    """Import seasons from contants.py
    """
    for season_data in constants.SEASONS:
        season = Season(**season_data)
        try:
            season.save()
        except IntegrityError:
            continue


def import_maps():
    """Import maps from constants.py
    """
    for map_data in constants.MAPS:
        _map = Map(**map_data)
        try:
            _map.save()
        except IntegrityError:
            continue


def import_queues():
    """Import queues from constants.py
    """
    for q_data in constants.QUEUES:
        q = Queue(**q_data)
        try:
            q.save()
        except IntegrityError:
            continue


def import_gamemodes():
    """Import gamemodes from constants.py
    """
    for gamemode_data in constants.GAMEMODES:
        gamemode = GameMode(**gamemode_data)
        try:
            gamemode.save()
        except IntegrityError:
            continue


def import_gametypes():
    """Import gametypes from constants.py
    """
    for gametype_data in constants.GAMETYPES:
        gametype = GameType(**gametype_data)
        try:
            gametype.save()
        except IntegrityError:
            continue


def import_reforgedrunes(version='', language='en_US', overwrite=False):
    """Import reforged runes through api.
    """
    api = get_riot_api()
    if api:
        r = api.lolstaticdata.runes_reforged(version=version, language=language)
        data = r.json()
        for tree_data in data:
            tree_model_data = {
                '_id': tree_data['id'],
                'key': tree_data['key'],
                'name': tree_data['name'],
                'language': language,
                'version': version,
                'icon': tree_data['icon'],
            }
            reforgedtree_model = ReforgedTree(**tree_model_data)
            try:
                reforgedtree_model.save()
            except IntegrityError as error:
                if overwrite:
                    query = ReforgedTree.objects.filter(language=language, version=version, _id=tree_data['id'])
                    if query.exists():
                        query.first().delete()
                        reforgedtree_model.save()
                else:
                    raise error

            slots = tree_data.pop('slots')
            for row, slot in enumerate(slots):
                for sort_int, _rune in enumerate(slot['runes']):
                    rune_model_data = {
                        'reforgedtree': reforgedtree_model,
                        'icon': _rune['icon'],
                        '_id': _rune['id'],
                        'key': _rune['key'],
                        'long_description': _rune['longDesc'],
                        'short_description': _rune['shortDesc'],
                        'name': _rune['name'],
                        'row': row,
                        'sort_int': sort_int,
                    }
                    reforgedrune_model = ReforgedRune(**rune_model_data)
                    reforgedrune_model.save()


def import_items(version='', language='en_US', overwrite=False):
    """Import all items for a version/language combo.

    Parameters
    ----------
    version : str
        ex - 9.3.1, 9.2.1...
    language : str
    overwrite : bool
        whether or not to overwrite old data

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        r = api.lolstaticdata.items(version=version, language=language)
        data = r.json()['data']
        for item_id, _item in data.items():

            # Item
            item_model_data = {
                '_id': int(item_id),
                'version': version,
                'language': language,
                'colloq': _item['colloq'],
                'depth': _item.get('depth', None),
                'group': _item.get('group', ''),
                'description': _item['description'],
                'name': _item['name'],
                'plaintext': _item['plaintext'],
                'required_ally': _item.get('requiredAlly', ''),
                'required_champion': _item.get('requiredChampion', ''),
                'in_store': _item.get('inStore', True),
                'consumed': _item.get('consumed', False),
                'consume_on_full': _item.get('consumeOnFull', False),
                'special_recipe': _item.get('specialRecipe', None),
                'stacks': _item.get('stacks', None),
            }
            item_model = Item(**item_model_data)
            item_model.save()

            # FromItem
            from_items = _item.get('from', [])
            for from_item_id in from_items:
                from_item_model_data = {
                    'item': item_model,
                    '_id': from_item_id,
                }
                from_item_model = FromItem(**from_item_model_data)
                from_item_model.save()

            # IntoItem
            into_items = _item.get('into', [])
            for into_item_id in into_items:
                into_item_model_data = {
                    'item': item_model,
                    '_id': into_item_id,
                }
                into_item_model = IntoItem(**into_item_model_data)
                into_item_model.save()

            gold_data = _item.get('gold', {})
            if gold_data:
                gold_model_data = {
                    'item': item_model,
                    'base': gold_data['base'],
                    'purchasable': gold_data['purchasable'],
                    'sell': gold_data['sell'],
                    'total': gold_data['total'],
                }
                item_gold_model = ItemGold(**gold_model_data)
                item_gold_model.save()

            # ItemEffect
            effects = _item.get('effects', {})
            for eff, value in effects.items():
                effect_model_data = {
                    'item': item_model,
                    'key': eff,
                    'value': value
                }
                effect_model = ItemEffect(**effect_model_data)
                effect_model.save()

            # ItemImage
            image = _item.get('image', {})
            if image:
                image_model_data = {
                    'item': item_model,
                    'full': image.get('full', ''),
                    'group': image.get('group', ''),
                    'h': image.get('h', 0),
                    'sprite': image.get('sprite', ''),
                    'w': image.get('w', ''),
                    'x': image.get('x', ''),
                    'y': image.get('y', ''),
                }
                image_model = ItemImage(**image_model_data)
                image_model.save()

            # ItemMap
            maps = _item.get('map', {})
            if maps:
                for key, val in maps.items():
                    map_model_data = {
                        'item': item_model,
                        'key': int(key),
                        'value': val,
                    }
                    item_map_model = ItemMap(**map_model_data)
                    item_map_model.save()

            # ItemStat
            stats = _item.get('stats', {})
            if stats:
                for key, val in stats.items():
                    val = round(float(val), 4)
                    stat_model_data = {
                        'item': item_model,
                        'key': key,
                        'value': val,
                    }
                    item_stat_model = ItemStat(**stat_model_data)
                    item_stat_model.save()

            # ItemTag
            tags = _item.get('tags', [])
            for tag in tags:
                query = ItemTag.objects.filter(name=tag)
                if query.exists():
                    item_tag_model = query.first()
                else:
                    item_tag_model = ItemTag(name=tag)
                    item_tag_model.save()
                item_tag_model.items.add(item_model)

            rune = _item.get('rune', {})
            if rune:
                rune_model = ItemRune(
                    item=item_model,
                    is_rune=rune.get('isrune', False),
                    tier=rune['tier'],
                    _type=rune['type']
                    )
                rune_model.save()
