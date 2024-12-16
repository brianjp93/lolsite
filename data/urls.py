from django.urls import path
from . import views

app_name = 'data'

urlpatterns = [
    path("items/recent/", views.ItemStatsView.as_view(), name="item-stats"),
]
