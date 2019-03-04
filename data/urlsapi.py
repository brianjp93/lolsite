from django.urls import path, include
from data import viewsapi as data_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('profile-icon/', data_views.get_profile_icon),
    path('item/', data_views.get_item),
]

urlpatterns = format_suffix_patterns(urlpatterns)