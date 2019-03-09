from django.urls import path, include
from match import viewsapi as match_api
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('timeline/', match_api.get_match_timeline),
    path('participants/', match_api.get_participants),
]

urlpatterns = format_suffix_patterns(urlpatterns)
