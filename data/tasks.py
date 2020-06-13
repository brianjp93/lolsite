"""data/tasks.py
"""
from multiprocessing.dummy import Pool as ThreadPool

from .models import Rito
from .models import Season, Map, Queue
from .models import GameMode, GameType
from .models import ReforgedTree, ReforgedRune

from .models import Item, ItemEffect, FromItem, IntoItem
from .models import ItemGold, ItemImage, ItemMap, ItemStat
from .models import ItemTag, ItemRune

from .models import ProfileIcon

from .models import Champion, ChampionImage, ChampionInfo
from .models import ChampionStats, ChampionTag
from .models import ChampionPassive, ChampionPassiveImage
from .models import ChampionSkin, ChampionSpell, ChampionSpellImage
from .models import ChampionEffectBurn, ChampionSpellVar
from .models import SummonerSpell, SummonerSpellImage
from .models import SummonerSpellMode, SummonerSpellEffectBurn
from .models import SummonerSpellVar

from django.db.utils import IntegrityError
from django.utils import timezone

from . import constants
from celery import task
from lolsite.tasks import get_riot_api


@task(name='data.tasks.import_missing')
def import_missing(max_versions=10, until_found=True, language='en_US', last_import_hours=1):
    """

    Parameters
    ----------
    max_versions: int
        The max number of data versions to import
    until_found: bool
        Once a version that exists in the DB is found, stop
    last_import_hours: int
        only run import if the last import was done more than
        <last_import_hours> hours ago.

    Returns
    -------
    None

    """
    rito = Rito.objects.first()
    thresh = timezone.now() - timezone.timedelta(hours=last_import_hours)
    if rito.last_data_import is None or rito.last_data_import < thresh:
        rito.last_data_import = timezone.now()
        rito.save()
        api = get_riot_api()
        r = api.lolstaticdata.versions()
        for version in r.json()[:max_versions]:
            query = Champion.objects.filter(version=version, language=language)
            if not query.exists():
                print(f'Importing data for version {version}')
                import_all(version, language=language)
            else:
                if until_found:
                    return


@task(name='data.tasks.import_all')
def import_all(version, language='en_US', overwrite=False):
    """Import all constants data from constants.py and riot api.

    Adds data to database

    Parameters
    ----------
    version : str
    language : str

    Returns
    -------
    None

    """
    # import from data.constants.py
    import_seasons()
    import_maps()
    import_queues()
    import_gamemodes()
    import_gametypes()

    # require api connection
    import_items(version=version, language=language, overwrite=overwrite)
    import_profile_icons(version=version, language=language, overwrite=overwrite)
    import_champions(version=version, language=language, overwrite=overwrite)
    import_all_champion_advanced(version, language=language, overwrite=overwrite)
    import_summoner_spells(version=version, language=language)
    import_reforgedrunes(version=version, language=language, overwrite=overwrite)


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


@task(name='data.tasks.import_reforgedrunes')
def import_reforgedrunes(version='', language='en_US', overwrite=False):
    """Import reforged runes through api.

    Parameters
    ----------
    version : str
    language : str
    overwrite : bool

    Returns
    -------
    None

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
            try:
                item_model.save()
            except IntegrityError as error:
                if overwrite:
                    query = Item.objects.filter(version=version, language=language, _id=int(item_id))
                    if query.exists():
                        query.first().delete()
                        item_model.save()
                    else:
                        raise Exception('Could not find queried item.')
                else:
                    raise error


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
            effects = _item.get('effect', {})
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
            maps = _item.get('maps', {})
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


def import_profile_icons(version='', language='en_US', overwrite=False):
    """Import profile icon data from datadragon.

    Parameters
    ----------
    version : str
    language : str
    overwrite : bool
        Whether or not to overwrite old data

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        r = api.lolstaticdata.profile_icons(version=version, language=language)
        data = r.json()
        for _id, profile_data in data['data'].items():
            image_data = profile_data['image']
            icon_model_data = {
                '_id': profile_data['id'],
                'version': version,
                'language': language,
                'full': image_data.get('full', ''),
                'group': image_data.get('group', ''),
                'h': image_data.get('h', 0),
                'sprite': image_data.get('sprite', ''),
                'w': image_data.get('w', 0),
                'x': image_data.get('x', 0),
                'y': image_data.get('y', 0),
            }
            profile_icon_model = ProfileIcon(**icon_model_data)
            try:
                profile_icon_model.save()
            except IntegrityError as error:
                if overwrite:
                    query = ProfileIcon.objects.filter(version=version, language=language, _id=profile_data['id'])
                    if query.exists():
                        query.first().delete()
                        profile_icon_model.save()
                    else:
                        raise Exception(f'Could not find ProfileIcon(version={version}, language={language}, _id={profile_data["id"]})')
                else:
                    continue


def import_champions(version='', language='en_US', overwrite=False):
    """Import champion data from datadragon.

    Parameters
    ----------
    version : str
    language : str
    overwrite : bool

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        r = api.lolstaticdata.champions(language=language, version=version)
        data = r.json()['data']
        for name, champion_data in data.items():

            # Champion
            champion_model_data = {
                '_id': champion_data['id'],
                'version': version,
                'language': language,
                'key': champion_data['key'],
                'name': champion_data['name'],
                'partype': champion_data['partype'],
                'title': champion_data['title'],
            }
            champion_model = Champion(**champion_model_data)
            try:
                champion_model.save()
            except IntegrityError as error:
                if overwrite:
                    query = Champion.objects.get(_id=champion_data['id'], language=language, version=version)
                    query.delete()
                    champion_model.save()
                else:
                    raise error

            # ChampionInfo
            info_data = champion_data['info']
            info_model_data = {
                'champion': champion_model,
                'attack': info_data['attack'],
                'defense': info_data['defense'],
                'difficulty': info_data['difficulty'],
                'magic': info_data['magic'],
            }
            info_model = ChampionInfo(**info_model_data)
            info_model.save()

            # ChampionImage
            image_data = champion_data['image']
            image_model_data = {
                'champion': champion_model,
                'full': image_data['full'],
                'group': image_data['group'],
                'h': image_data['h'],
                'sprite': image_data['sprite'],
                'w': image_data['w'],
                'x': image_data['x'],
                'y': image_data['y'],
            }
            image_model = ChampionImage(**image_model_data)
            image_model.save()

            # ChampionStats
            stat_data = champion_data['stats']
            stat_model_data = {
                'champion': champion_model,
                'armor': stat_data['armor'],
                'armor_per_level': stat_data['armorperlevel'],
                'attack_damage': stat_data['attackdamage'],
                'attack_damage_per_level': stat_data['attackdamageperlevel'],
                'attack_range': stat_data['attackrange'],
                'attack_speed': stat_data.get('attackspeed', None),
                'attack_speed_per_level': stat_data['attackspeedperlevel'],
                'crit': stat_data['crit'],
                'crit_per_level': stat_data['critperlevel'],
                'hp': stat_data['hp'],
                'hp_per_level': stat_data['hpperlevel'],
                'hp_regen': stat_data['hpregen'],
                'hp_regen_per_level': stat_data['hpregenperlevel'],
                'move_speed': stat_data['movespeed'],
                'mp': stat_data['mp'],
                'mp_per_level': stat_data['mpperlevel'],
                'mp_regen': stat_data['mpregenperlevel'],
                'mp_regen_per_level': stat_data['mpregenperlevel'],
                'spell_block': stat_data['spellblock'],
                'spell_block_per_level': stat_data['spellblockperlevel'],
            }
            stat_model = ChampionStats(**stat_model_data)
            stat_model.save()

            # ChampionTag
            tag_data = champion_data['tags']
            for tag in tag_data:
                query = ChampionTag.objects.filter(name=tag)
                if query.exists():
                    tag_model = query.first()
                else:
                    tag_model = ChampionTag(name=tag)
                    tag_model.save()
                tag_model.champions.add(champion_model)


def import_champion_advanced(champion_id, overwrite=False):
    """Import further in-depth champion data.

    Parameters
    ----------
    champion_id : ID
        Internal DB ID of Champion model
    overwrite : bool
        whether or not to overwrite current models, if they exist.

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        query = Champion.objects.filter(id=champion_id)
        if query.exists():
            champion_model = query.first()
            r = api.lolstaticdata.champions(name=champion_model._id, language=champion_model.language, version=champion_model.version)
            data = r.json()['data'][champion_model._id]
            champion_model.lore = data['lore']
            champion_model.save()

            passive_data = data['passive']
            passive_model_data = {
                'champion': champion_model,
                'description': passive_data['description'],
                'name': passive_data['name'],
            }
            champion_passive_model = ChampionPassive(**passive_model_data)
            try:
                champion_passive_model.save()
            except IntegrityError as error:
                if overwrite:
                    old_model = ChampionPassive.objects.get(champion=champion_model)
                    old_model.delete()
                    champion_passive_model.save()
                else:
                    raise error

            passive_image_data = passive_data['image']
            passive_image_model_data = {
                'passive': champion_passive_model,
                'full': passive_image_data['full'],
                'group': passive_image_data['group'],
                'h': passive_image_data['h'],
                'sprite': passive_image_data['sprite'],
                'w': passive_image_data['w'],
                'x': passive_image_data['x'],
                'y': passive_image_data['y'],
            }
            passive_image_model = ChampionPassiveImage(**passive_image_model_data)
            passive_image_model.save()

            skins_data = data['skins']
            for skin_data in skins_data:
                skin_model_data = {
                    'champion': champion_model,
                    '_id': skin_data['id'],
                    'chromas': skin_data['chromas'],
                    'name': skin_data['name'],
                    'num': skin_data['num'],
                }
                skin_model = ChampionSkin(**skin_model_data)
                try:
                    skin_model.save()
                except IntegrityError as error:
                    if overwrite:
                        old_model = ChampionSkin.objects.get(champion=champion_model, _id=skin_data['id'])
                        old_model.delete()
                        skin_model.save()
                    else:
                        raise error


            for spell_data in data['spells']:
                spell_model_data = {
                    'champion': champion_model,
                    '_id': spell_data['id'],
                    'cooldown_burn': spell_data['cooldownBurn'],
                    'cost_burn': spell_data['costBurn'],
                    'cost_type': spell_data['costType'],
                    'description': spell_data['description'],
                    'max_ammo': spell_data['maxammo'],
                    'max_rank': spell_data['maxrank'],
                    'name': spell_data['name'],
                    'range_burn': spell_data['rangeBurn'],
                    'resource': spell_data.get('resource', ''),
                    'tooltip': spell_data['tooltip'],
                }

                spell_model = ChampionSpell(**spell_model_data)
                try:
                    spell_model.save()
                except IntegrityError as error:
                    if overwrite:
                        old_model = ChampionSpell.objects.get(champion=champion_model, _id=spell_data['id'])
                        old_model.delete()
                        spell_model.save()
                    else:
                        raise error

                spell_image_data = spell_data['image']
                spell_image_model_data = {
                    'spell': spell_model,
                    'full': spell_image_data['full'],
                    'group': spell_image_data['group'],
                    'h': spell_image_data['h'],
                    'sprite': spell_image_data['sprite'],
                    'w': spell_image_data['w'],
                    'x': spell_image_data['x'],
                    'y': spell_image_data['y'],
                }
                spell_image_model = ChampionSpellImage(**spell_image_model_data)
                spell_image_model.save()

                for i, effect_burn_data in enumerate(spell_data['effectBurn']):
                    effect_burn_model_data = {
                        'spell': spell_model,
                        'sort_int': i,
                        'value': effect_burn_data,
                    }
                    effect_burn_model = ChampionEffectBurn(**effect_burn_model_data)
                    effect_burn_model.save()

                for i, var_data in enumerate(spell_data['vars']):
                    coeff = var_data['coeff']
                    if type(coeff) == list:
                        coeff = '/'.join([str(x) for x in coeff])
                    else:
                        coeff = str(coeff)
                    var_model_data = {
                        'spell': spell_model,
                        'coeff': coeff,
                        'key': var_data['key'],
                        'link': var_data['link'],
                        'sort_int': i,
                    }
                    var_model = ChampionSpellVar(**var_model_data)
                    var_model.save()


def import_all_champion_advanced(version, language='en_US', overwrite=False):
    """Get all in-depth data on champions matching the version and language given.

    This function may take a while.  It requires 1 api request per champion.

    Parameters
    ----------
    version : str
    language : str
    overwrite : bool

    Returns
    -------
    None

    """
    query = Champion.objects.filter(version=version)
    if language:
        query = query.filter(language=language)
    with ThreadPool(10) as pool:
        for champion in query:
            has_lore = False
            if champion.lore:
                has_lore = True
            if not has_lore or overwrite:
                # print(f'Importing data for {champion._id}.')
                pool.apply_async(import_champion_advanced, (champion.id, overwrite))


def import_summoner_spells(version='', language='en_US'):
    """Import summoner spells from datadragon.
    """
    api = get_riot_api()
    if api:
        r = api.lolstaticdata.summoner_spells(version=version, language=language)
        data = r.json()['data']
        for _id, _spell in data.items():
            spell_model_data = {
                '_id': _spell['id'],
                'key': _spell['key'],
                'version': version,
                'language': language,
                'cooldown_burn': _spell['cooldownBurn'],
                'cost_burn': _spell['costBurn'],
                'cost_type': _spell['costType'],
                'description': _spell['description'],
                'max_ammo': _spell['maxammo'],
                'max_rank': _spell['maxrank'],
                'name': _spell['name'],
                'resource': _spell.get('resource', None),
                'summoner_level': _spell['summonerLevel'],
                'tooltip': _spell['tooltip'],
            }
            spell_model = SummonerSpell(**spell_model_data)
            try:
                spell_model.save()
            except IntegrityError as error:
                query = SummonerSpell.objects.filter(version=version, language=language, key=_spell['key'])
                if query.exists():
                    query.first().delete()
                    spell_model.save()

            for i, effect_burn_data in enumerate(_spell['effectBurn']):
                effect_burn_model_data = {
                    'spell': spell_model,
                    'value': effect_burn_data,
                    'sort_int': i,
                }
                effect_burn_model = SummonerSpellEffectBurn(**effect_burn_model_data)
                effect_burn_model.save()

            image_data = _spell['image']
            image_model_data = {
                'spell': spell_model,
                'full': image_data['full'],
                'group': image_data['group'],
                'h': image_data['h'],
                'sprite': image_data['sprite'],
                'x': image_data['x'],
                'w': image_data['w'],
                'y': image_data['y'],
            }
            image_model = SummonerSpellImage(**image_model_data)
            image_model.save()

            for i, mode_data in enumerate(_spell['modes']):
                mode_model_data = {
                    'spell': spell_model,
                    'name': mode_data,
                    'sort_int': i,
                }
                mode_model = SummonerSpellMode(**mode_model_data)
                mode_model.save()

            _vars = _spell['vars']
            for i, var in enumerate(_vars):
                coeffs = var['coeff']
                if type(coeffs) == list:
                    coeffs = '/'.join([str(x) for x in coeffs])
                else:
                    coeffs = str(coeffs)
                var_model_data = {
                    'spell': spell_model,
                    'coeff': coeffs,
                    'link': var['link'],
                    'key': var['key'],
                    'sort_int': i,
                }
                var_model = SummonerSpellVar(**var_model_data)
                var_model.save()

