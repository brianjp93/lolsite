import hashlib

from django.contrib import admin
from django.core.paginator import Paginator
from django.core.cache import cache

from .models import Comment, Summoner, NameChange, SummonerNote
from .models import RankCheckpoint, RankPosition
from .models import Custom, EmailVerification, SummonerLink


class CachedCountPaginator(Paginator):
    @property
    def count(self):  # type: ignore
        explain_string = self.object_list.explain()  # type: ignore
        bytes_string = bytes(explain_string, "utf8")
        hex_hash = hashlib.md5(bytes_string).hexdigest()
        data = cache.get(hex_hash, None)
        if data is None:
            data = super().count
            cache.set(hex_hash, data, 60 * 60 * 12)
        return data


class SummonerAdmin(admin.ModelAdmin):
    list_display = ("simple_riot_id", "region")
    search_fields = ("simple_riot_id",)
    list_select_related = True
    raw_id_fields = ("user", "pro")
    show_full_result_count = False
    list_per_page = 20
    paginator = CachedCountPaginator


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
    )
    raw_id_fields = ("checkpoint",)


class CustomAdmin(admin.ModelAdmin):
    list_display = ("user", "is_email_verified", "created_date")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)


class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "code")
    raw_id_fields = ("user",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("match", "summoner", "markdown_content")
    raw_id_fields = ('match', 'summoner', 'reply_to', 'liked_by', 'disliked_by')

    def markdown_content(self, obj):
        if obj.markdown:
            return obj.markdown[:20]
        return ''


@admin.register(SummonerNote)
class SummonerNoteAdmin(admin.ModelAdmin):
    list_display = ("user", "summoner")
    raw_id_fields = ("user", "summoner")


admin.site.register(Summoner, SummonerAdmin)
admin.site.register(SummonerLink, SummonerLinkAdmin)
admin.site.register(NameChange, NameChangeAdmin)
admin.site.register(RankCheckpoint, RankCheckpointAdmin)
admin.site.register(RankPosition, RankPositionAdmin)
admin.site.register(Custom, CustomAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
