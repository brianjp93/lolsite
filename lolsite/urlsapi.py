"""lolsite/urlsapi.py
"""
from django.urls import path, include

urlpatterns = [
    path("fun/", include('fun.urlsapi')),
    path("player/", include('player.urlsapi')),
    path("data/", include('data.urlsapi')),
    path("match/", include('match.urlsapi')),
    path("notification/", include('notification.urlsapi')),
]
