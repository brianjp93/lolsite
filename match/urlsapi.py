from django.urls import path
from match import viewsapi as match_api
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path(
        "by-summoner/<str:region>/<str:riot_id_name>/<str:riot_id_tagline>/",
        match_api.MatchBySummoner.as_view(),
        name="matches-by-summoner",
    ),
    path("<slug:match_id>/timeline/", match_api.AdvancedTimelineView.as_view()),
    path("<slug:match_id>/summary/", match_api.MatchSummaryView.as_view()),
    path("participants/", match_api.ParticipantsView.as_view()),
    path("get-spectate/", match_api.get_spectate),
    path("check-for-live-game/", match_api.check_for_live_game),
    path("major-patches/", match_api.MajorPatchView.as_view(), name="major-patches"),
    path("<slug:_id>/", match_api.MatchView.as_view()),
    path(
        "<slug:_id>/bans/", match_api.MatchBanListView.as_view(), name="match-ban-view"
    ),
    path("participant/set-role/", match_api.set_role_label),
    path("get-latest-unlabeled/", match_api.get_latest_unlabeled_match),
]

urlpatterns = format_suffix_patterns(urlpatterns)
