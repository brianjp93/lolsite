from django.urls import path, include
from match import viewsapi as match_api
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('full-match/', match_api.get_full_match),
]

urlpatterns = format_suffix_patterns(urlpatterns)
