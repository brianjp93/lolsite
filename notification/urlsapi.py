"""notification/urlsapi.py
"""
from django.urls import path
from notification import viewsapi as notification_api
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path("", notification_api.notification),
]

urlpatterns = format_suffix_patterns(urlpatterns)
