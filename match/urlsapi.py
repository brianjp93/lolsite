from django.urls import path, include
from match import viewsapi as match_api
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('timeline/', match_api.get_match_timeline),
    path('participants/', match_api.get_participants),
    path('get-spectate/', match_api.get_spectate),
    path('check-for-live-game/', match_api.check_for_live_game),
    path('get/', match_api.get_match),
]

urlpatterns = format_suffix_patterns(urlpatterns)
