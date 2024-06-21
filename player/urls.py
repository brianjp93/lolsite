from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r"(?P<region>(?:na|eune|euw|jp|kr|lan|las|br|oce|tr|ru))/(?P<name>[^\-]+)-(?P<tagline>\w+)/$", views.SummonerPage.as_view()),
]
