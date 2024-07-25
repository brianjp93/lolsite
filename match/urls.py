from django.urls import path
from . import views

app_name = 'match'

urlpatterns = [
    path("match/<slug:slug>/", views.MatchDetailView.as_view(), name="match-detail"),
]
