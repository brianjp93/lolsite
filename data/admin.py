from django.contrib import admin
from .models import Rito
from .models import Queue, Season, Map
from .models import GameMode, GameType
from .models import ReforgedTree, ReforgedRune

from .models import Item


class RitoAdmin(admin.ModelAdmin):
    list_display = ('token',)


class QueueAdmin(admin.ModelAdmin):
    list_display = ('_map', '_id')


class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', '_id')


class MapAdmin(admin.ModelAdmin):
    list_display = ('name', '_id')


class GameModeAdmin(admin.ModelAdmin):
    list_display = ('name',)


class GameTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)


class ReforgedTreeAdmin(admin.ModelAdmin):
    list_display = ('key', 'version', 'language')
    list_filter = ('version', 'language')


class ReforgedRuneAdmin(admin.ModelAdmin):
    list_display = ('key', 'reforgedtree', 'row', 'sort_int')
    list_filter = ('reforgedtree__version', 'reforgedtree__language')
    raw_id_fields = ('reforgedtree',)


class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'version', 'language')


admin.site.register(Rito, RitoAdmin)
admin.site.register(Queue, QueueAdmin)
admin.site.register(Season, SeasonAdmin)
admin.site.register(Map, MapAdmin)
admin.site.register(GameMode, GameModeAdmin)
admin.site.register(GameType, GameTypeAdmin)
admin.site.register(ReforgedTree, ReforgedTreeAdmin)
admin.site.register(ReforgedRune, ReforgedRuneAdmin)
admin.site.register(Item, ItemAdmin)