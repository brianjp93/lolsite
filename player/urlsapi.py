from django.urls import path, include
from . import viewsapi as player_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('summoner/', player_views.get_summoner),
    path('summoner-page/', player_views.get_summoner_page),
    path('positions/', player_views.get_positions),
]

urlpatterns = format_suffix_patterns(urlpatterns)