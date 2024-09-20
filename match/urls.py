from django.urls import path
from . import views

app_name = 'match'

urlpatterns = [
    path("match/<slug:slug>/", views.MatchDetailView.as_view(), name="match-detail"),
    path("check-for-live-game/<str:region>/<str:puuid>/", views.check_for_live_game, name="check-for-live-game"),
]
