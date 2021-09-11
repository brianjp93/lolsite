from django.contrib import admin

from .models import Rito
from .models import Queue, Season, Map
from .models import GameMode, GameType
from .models import ReforgedTree, ReforgedRune

from .models import Item, FromItem, IntoItem, ItemEffect
from .models import ItemGold, ItemImage, ItemMap
from .models import ItemStat, ItemTag, ItemRune

from .models import ProfileIcon

from .models import Champion, ChampionImage, ChampionInfo
from .models import ChampionStats, ChampionTag
from .models import ChampionPassive, ChampionPassiveImage
from .models import ChampionSkin, ChampionSpell, ChampionSpellImage
from .models import ChampionEffectBurn, ChampionSpellVar

from .models import SummonerSpell, SummonerSpellImage
from .models import SummonerSpellMode, SummonerSpellEffectBurn
from .models import SummonerSpellVar


class RitoAdmin(admin.ModelAdmin):
    list_display = ("token",)


class QueueAdmin(admin.ModelAdmin):
    list_display = ("_map", "_id")


class SeasonAdmin(admin.ModelAdmin):
    list_display = ("name", "_id")


class MapAdmin(admin.ModelAdmin):
    list_display = ("name", "_id", "minimap_url")


class GameModeAdmin(admin.ModelAdmin):
    list_display = ("name",)


class GameTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)


class ReforgedTreeAdmin(admin.ModelAdmin):
    list_display = ("key", "version", "language")
    list_filter = ("version", "language")


class ReforgedRuneAdmin(admin.ModelAdmin):
    list_display = ("key", "reforgedtree", "row", "sort_int")
    list_filter = ("reforgedtree__version", "reforgedtree__language")
    raw_id_fields = ("reforgedtree",)


class ItemAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "last_changed", "language")
    list_filter = ("version", "language")
    search_fields = ('name', )


class FromItemAdmin(admin.ModelAdmin):
    list_display = ("item", "_id")
    raw_id_fields = ("item",)


class IntoItemAdmin(admin.ModelAdmin):
    list_display = ("item", "_id")
    raw_id_fields = ("item",)


class ItemEffectAdmin(admin.ModelAdmin):
    list_display = ("item", "key", "value")
    raw_id_fields = ("item",)


class ItemGoldAdmin(admin.ModelAdmin):
    list_display = ("item", "base", "purchasable", "sell", "total")
    raw_id_fields = ("item",)


class ItemImageAdmin(admin.ModelAdmin):
    list_display = ("item", "full", "sprite")
    raw_id_fields = ("item",)


class ItemMapAdmin(admin.ModelAdmin):
    list_display = ("item", "key", "value")
    raw_id_fields = ("item",)


class ItemStatAdmin(admin.ModelAdmin):
    list_display = ("item", "key", "value")
    list_filter = ("item__version", "item__language")
    raw_id_fields = ("item",)


class ItemTagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    raw_id_fields = ("items",)


class ItemRuneAdmin(admin.ModelAdmin):
    list_display = ("item", "is_rune", "tier", "_type")
    raw_id_fields = ("item",)


class ProfileIconAdmin(admin.ModelAdmin):
    list_display = ("_id", "full", "sprite")
    list_filter = ("version", "language")


class ChampionAdmin(admin.ModelAdmin):
    list_display = ("_id", "key", "version", "last_changed", "language")
    list_filter = ("version", "language")


class ChampionImageAdmin(admin.ModelAdmin):
    list_display = ("champion", "full", "image_url", "splash_url", "loading_art_url")
    raw_id_fields = ("champion",)
    list_filter = ("champion__major", "champion__minor")


class ChampionInfoAdmin(admin.ModelAdmin):
    list_display = ("champion", "attack", "defense", "difficulty", "magic")
    raw_id_fields = ("champion",)


class ChampionStatsAdmin(admin.ModelAdmin):
    list_display = ("champion",)
    list_filter = ("champion__version", "champion__language")
    raw_id_fields = ("champion",)


class ChampionTagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    raw_id_fields = ("champions",)


class ChampionPassiveAdmin(admin.ModelAdmin):
    list_display = ("champion", "name", "image_url")
    raw_id_fields = ("champion",)


class ChampionPassiveImageAdmin(admin.ModelAdmin):
    list_display = ("passive", "image_url")
    raw_id_fields = ("passive",)


class ChampionSkinAdmin(admin.ModelAdmin):
    list_display = ("champion", "name", "splash_url", "loading_art_url")
    raw_id_fields = ("champion",)


class ChampionSpellAdmin(admin.ModelAdmin):
    list_display = ("champion", "_id", "name")
    raw_id_fields = ("champion",)
    list_filter = ("champion___id", "champion__version", "champion__language")


class ChampionSpellImageAdmin(admin.ModelAdmin):
    list_display = ("spell", "image_url")
    raw_id_fields = ("spell",)


class ChampionEffectBurnAdmin(admin.ModelAdmin):
    list_display = ("spell", "sort_int")
    raw_id_fields = ("spell",)


class ChampionSpellVarAdmin(admin.ModelAdmin):
    list_display = ("spell", "key", "coeff")
    raw_id_fields = ("spell",)
    list_filter = (
        "spell__champion___id",
        "spell__champion__version",
        "spell__champion__language",
    )


class SummonerSpellAdmin(admin.ModelAdmin):
    list_display = ("key", "version", "language")
    list_filter = ("version", "language")


class SummonerSpellImageAdmin(admin.ModelAdmin):
    list_display = ("spell", "image_url")
    raw_id_fields = ("spell",)


class SummonerSpellModeAdmin(admin.ModelAdmin):
    list_display = ("spell", "name")
    raw_id_fields = ("spell",)
    list_filter = ("spell__version", "spell__language")


class SummonerSpellEffectBurnAdmin(admin.ModelAdmin):
    list_display = ("spell", "value", "sort_int")
    raw_id_fields = ("spell",)
    list_filter = ("spell__version", "spell__language")


class SummonerSpellVarAdmin(admin.ModelAdmin):
    list_display = ("spell", "key", "coeff")
    raw_id_fields = ("spell",)
    list_filter = ("spell__version", "spell__language")


admin.site.register(Rito, RitoAdmin)
admin.site.register(Queue, QueueAdmin)
admin.site.register(Season, SeasonAdmin)
admin.site.register(Map, MapAdmin)
admin.site.register(GameMode, GameModeAdmin)
admin.site.register(GameType, GameTypeAdmin)

admin.site.register(ReforgedTree, ReforgedTreeAdmin)
admin.site.register(ReforgedRune, ReforgedRuneAdmin)

admin.site.register(Item, ItemAdmin)
admin.site.register(FromItem, FromItemAdmin)
admin.site.register(IntoItem, IntoItemAdmin)
admin.site.register(ItemEffect, ItemEffectAdmin)
admin.site.register(ItemGold, ItemGoldAdmin)
admin.site.register(ItemImage, ItemImageAdmin)
admin.site.register(ItemMap, ItemMapAdmin)
admin.site.register(ItemStat, ItemStatAdmin)
admin.site.register(ItemTag, ItemTagAdmin)
admin.site.register(ItemRune, ItemRuneAdmin)

admin.site.register(ProfileIcon, ProfileIconAdmin)

admin.site.register(Champion, ChampionAdmin)
admin.site.register(ChampionImage, ChampionImageAdmin)
admin.site.register(ChampionInfo, ChampionInfoAdmin)
admin.site.register(ChampionStats, ChampionStatsAdmin)
admin.site.register(ChampionTag, ChampionTagAdmin)
admin.site.register(ChampionPassive, ChampionPassiveAdmin)
admin.site.register(ChampionPassiveImage, ChampionPassiveImageAdmin)
admin.site.register(ChampionSkin, ChampionSkinAdmin)
admin.site.register(ChampionSpell, ChampionSpellAdmin)
admin.site.register(ChampionSpellImage, ChampionSpellImageAdmin)
admin.site.register(ChampionEffectBurn, ChampionEffectBurnAdmin)
admin.site.register(ChampionSpellVar, ChampionSpellVarAdmin)

admin.site.register(SummonerSpell, SummonerSpellAdmin)
admin.site.register(SummonerSpellImage, SummonerSpellImageAdmin)
admin.site.register(SummonerSpellMode, SummonerSpellModeAdmin)
admin.site.register(SummonerSpellEffectBurn, SummonerSpellEffectBurnAdmin)
admin.site.register(SummonerSpellVar, SummonerSpellVarAdmin)
