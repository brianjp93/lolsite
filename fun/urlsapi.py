from django.urls import path, include
from fun import viewsapi as fun_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('inspirational-message/', fun_views.get_inspirational_message),
]

urlpatterns = format_suffix_patterns(urlpatterns)