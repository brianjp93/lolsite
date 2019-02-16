from django.urls import path, include

from fun import urlsapi as fun_urls
from player import urlsapi as player_urls
from data import urlsapi as data_urls
from match import urlsapi as match_urls

urlpatterns = [
    path('fun/', include(fun_urls)),
    path('player/', include(player_urls)),
    path('data/', include(data_urls)),
    path('match/', include(match_urls)),
]
