from django.urls import path, include
from . import viewsapi as player_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('summoner/', player_views.get_summoner),
    path('summoner-page/', player_views.get_summoner_page),
    path('champions-overview/', player_views.get_summoner_champions_overview),
    path('positions/', player_views.get_positions),
    path('sign-up/', player_views.sign_up),
    path('login/', player_views.login),
    path('verify/', player_views.verify_email),
]

urlpatterns = format_suffix_patterns(urlpatterns)