from django.urls import path, include
from data import viewsapi as data_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('profile-icon/', data_views.get_profile_icon),
]

urlpatterns = format_suffix_patterns(urlpatterns)