"""lolsite/urlsapi.py
"""
from django.urls import path, include
from . import viewsapi as lolsite_views

urlpatterns = [
    path("fun/", include('fun.urlsapi')),
    path("player/", include('player.urlsapi')),
    path("data/", include('data.urlsapi')),
    path("match/", include('match.urlsapi')),
    path("notification/", include('notification.urlsapi')),
    path("summoner-metadata/<str:region>/<str:name>/", lolsite_views.get_summoner_meta_data),
    path("match-metadata/<str:region>/<str:name>/<str:match_id>/", lolsite_views.get_match_meta_data),
]
