from django.contrib import admin
from .models import Summoner, NameChange
from .models import RankCheckpoint, RankPosition
from .models import Custom, EmailVerification, SummonerLink


class SummonerAdmin(admin.ModelAdmin):
    list_display = ("simple_name", "region")
    search_fields = ("simple_name", "account_id", "_id")
    list_filter = ("region",)
    raw_id_fields = ("user", "pro")
    show_full_result_count = False
    list_per_page = 20


class SummonerLinkAdmin(admin.ModelAdmin):
    list_display = ("user", "summoner")
    raw_id_fields = ("user", "summoner")
    search_fields = ("user__email", "summoner__simple_name")


class NameChangeAdmin(admin.ModelAdmin):
    list_display = ("summoner", "old_name", "created_date")
    search_fields = ("old_name", "summoner__name", "summoner__simple_name")


class RankCheckpointAdmin(admin.ModelAdmin):
    list_display = ("summoner", "created_date")
    search_fields = ("summoner__name", "summoner__simple_name", "summoner__account_id")
    raw_id_fields = ("summoner",)
    show_full_result_count = False
    list_per_page = 30


class RankPositionAdmin(admin.ModelAdmin):
    list_display = ("queue_type", "rank", "tier", "position")
    search_fields = (
        "checkpoint__summoner__name",
        "checkpoint__summoner__simple_name",
        "checkpoint__summoner__account_id",
    )
    raw_id_fields = ("checkpoint",)


class CustomAdmin(admin.ModelAdmin):
    list_display = ("user", "is_email_verified", "created_date")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)


class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "code")
    raw_id_fields = ("user",)


admin.site.register(Summoner, SummonerAdmin)
admin.site.register(SummonerLink, SummonerLinkAdmin)
admin.site.register(NameChange, NameChangeAdmin)
admin.site.register(RankCheckpoint, RankCheckpointAdmin)
admin.site.register(RankPosition, RankPositionAdmin)
admin.site.register(Custom, CustomAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
