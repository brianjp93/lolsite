from django.urls import path, include
from . import viewsapi as player_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('summoner/', player_views.get_summoner),
    path('summoner-search/', player_views.summoner_search),
    path('summoner-page/', player_views.get_summoner_page),
    path('champions-overview/', player_views.get_summoner_champions_overview),
    path('positions/', player_views.get_positions),
    path('sign-up/', player_views.sign_up),
    path('login/', player_views.login),
    path('verify/', player_views.verify_email),
    path('is-logged-in/', player_views.is_logged_in),
    path('rank-history/', player_views.get_rank_history),
    path('favorites/', player_views.favorites),
    path('generate-code/', player_views.generate_code),
    path('connect-account/', player_views.connect_account),
    path('get-connected-accounts/', player_views.get_connected_accounts),
]

urlpatterns = format_suffix_patterns(urlpatterns)