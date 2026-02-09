from django.urls import path
from . import viewsapi as player_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('me/', player_views.MyUserView.as_view(), name='me'),
    path(
        "reputation/<int:summoner_pk>/",
        player_views.ReputationRetrieveAPIView.as_view(),
        name="get-reputation",
    ),
    path(
        "reputation/create/",
        player_views.ReputationCreateView.as_view(),
        name="create-reputation",
    ),
    path(
        "reputation/update/<int:pk>/",
        player_views.ReputationUpdateView.as_view(),
        name="update-reputation",
    ),
    path("summoner/by-riot-id/<str:region>/<str:riot_id_name>/<str:riot_id_tagline>/", player_views.SummonerByRiotId.as_view()),
    path("summoner/", player_views.get_summoner),
    path("summoner/<int:summoner_pk>/name-changes/", player_views.NameChangeListView.as_view()),
    path("summoners/", player_views.get_summoners),
    path("summoner-search/", player_views.summoner_search),
    path("champions-overview/", player_views.get_summoner_champions_overview),
    path("positions/", player_views.get_positions),
    path("sign-up/", player_views.sign_up),
    path("verify/", player_views.verify_email),
    path("rank-history/", player_views.get_rank_history),
    path("favorites/", player_views.favorites),
    path("following/", player_views.following),
    path("following-list/", player_views.FollowingListAPIView.as_view()),
    path("generate-code/", player_views.generate_code),
    path("unlink-account/", player_views.unlink_account),
    path(
        "connect-account-with-profile-icon/",
        player_views.connect_account_with_profile_icon,
    ),
    path("get-connected-accounts/", player_views.get_connected_accounts),
    path("change-password/", player_views.change_password),
    path("comment/match/<int:match_id>/", player_views.CommentListView.as_view()),
    path("comment/", player_views.CommentCreateView.as_view()),
    path("comment/<int:pk>/", player_views.CommentRetrieveUpdateView.as_view()),
    path("comment/count/", player_views.comment_count),
    path("default-summoner/", player_views.edit_default_summoner),
    path('login/', player_views.login_action),
    path('logout/', player_views.logout_action),
    path('is_suspicious/', player_views.is_suspicious_account),
    path("summoner-note/", player_views.save_summoner_note),
]

urlpatterns = format_suffix_patterns(urlpatterns)
