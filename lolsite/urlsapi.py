from django.urls import path, include

from fun import urlsapi as fun_urls
from player import urlsapi as player_urls
from data import urlsapi as data_urls
from match import urlsapi as match_urls
from notification import urlsapi as notification_urls
from . import viewsapi as lolsite_views

urlpatterns = [
    path("fun/", include(fun_urls)),
    path("player/", include(player_urls)),
    path("data/", include(data_urls)),
    path("match/", include(match_urls)),
    path("notification/", include(notification_urls)),
    path("general/demo-login/", lolsite_views.demo_login),
]
