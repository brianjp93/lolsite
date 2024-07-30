from django.urls import path, re_path
from django.contrib.auth.views import LoginView, LogoutView
from . import views

app_name = 'player'

urlpatterns = [
    re_path(r"(?P<region>(?:na|eune|euw|jp|kr|lan|las|br|oce|tr|ru))/(?P<name>[^\-]+)-(?P<tagline>\w+)/$", views.SummonerPage.as_view(), name="summoner-page"),
    path("lookup/", views.SummonerLookup.as_view(), name="summoner-lookup"),
    path("puuid/<str:puuid>/", views.SummonerPagePuuid.as_view(), name="summoner-puuid"),
    path("player/login/", LoginView.as_view(), name="login-view"),
    path("player/logout/", LogoutView.as_view(), name="logout-view"),
]
