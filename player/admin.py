from django.contrib import admin
from .models import Summoner, NameChange
from .models import RankCheckpoint, RankPosition
from .models import Custom, EmailVerification


class SummonerAdmin(admin.ModelAdmin):
    list_display = ('simple_name', '_id', 'account_id', 'region', 'user')
    search_fields = ('name', 'simple_name', 'account_id', '_id', 'puuid')
    list_filter = ('region',)


class NameChangeAdmin(admin.ModelAdmin):
    list_display = ('summoner', 'old_name', 'created_date')
    search_fields = ('old_name', 'summoner__name', 'summoner__simple_name')


class RankCheckpointAdmin(admin.ModelAdmin):
    list_display = ('summoner', 'created_date')
    search_fields = ('summoner__name', 'summoner__simple_name', 'summoner__account_id')
    raw_id_fields = ('summoner',)


class RankPositionAdmin(admin.ModelAdmin):
    list_display = ('queue_type', 'rank', 'tier', 'position')
    search_fields = ('checkpoint__summoner__name', 'checkpoint__summoner__simple_name', 'checkpoint__summoner__account_id')
    raw_id_fields = ('checkpoint',)


class CustomAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_email_verified', 'created_date')
    search_fields = ('user__email',)
    raw_id_fields = ('user',)


class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'code')
    raw_id_fields = ('user',)


admin.site.register(Summoner, SummonerAdmin)
admin.site.register(NameChange, NameChangeAdmin)
admin.site.register(RankCheckpoint, RankCheckpointAdmin)
admin.site.register(RankPosition, RankPositionAdmin)
admin.site.register(Custom, CustomAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
