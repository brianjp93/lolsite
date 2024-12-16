from django.urls import path
from . import views

app_name = 'stats'

urlpatterns = [
    path("champions/<slug:puuid>/<int:queue>/<int:major>/<int:minor>/", views.champion_stats, name="champions-version"),
    path("champions/<slug:puuid>/<int:queue>/<int:major>/", views.champion_stats, name="champions-version"),
    path("champions/<slug:puuid>/", views.champion_stats, name="champions-default"),
]
