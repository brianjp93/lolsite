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
    path("get-csrf/", lolsite_views.get_csrf_token),
]
