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
    path("summoner/<str:region>/by-name/<str:name>/", player_views.SummonerByNameView.as_view()),
    path("summoner/", player_views.get_summoner),
    path("summoner/<int:summoner_pk>/name-changes/", player_views.NameChangeListView.as_view()),
    path("summoners/", player_views.get_summoners),
    path("summoner-search/", player_views.summoner_search),
    path("champions-overview/", player_views.get_summoner_champions_overview),
    path("positions/", player_views.get_positions),
    path("sign-up/", player_views.sign_up),
    path("verify/", player_views.verify_email),
    path("is-logged-in/", player_views.is_logged_in),
    path("rank-history/", player_views.get_rank_history),
    path("favorites/", player_views.favorites),
    path("generate-code/", player_views.generate_code),
    path("connect-account/", player_views.connect_account),
    path(
        "connect-account-with-profile-icon/",
        player_views.connect_account_with_profile_icon,
    ),
    path("get-connected-accounts/", player_views.get_connected_accounts),
    path("change-password/", player_views.change_password),
    path("get-top-played-with/", player_views.get_top_played_with),
    path("comment/", player_views.comment),
    path("comment/replies/", player_views.get_replies),
    path("comment/like/", player_views.like_comment),
    path("comment/dislike/", player_views.dislike_comment),
    path("comment/count/", player_views.comment_count),
    path("default-summoner/", player_views.edit_default_summoner),
    path('login/', player_views.login_action),
]

urlpatterns = format_suffix_patterns(urlpatterns)
