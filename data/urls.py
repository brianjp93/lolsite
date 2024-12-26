from django.urls import path
from . import views

app_name = 'data'

urlpatterns = [
    path("items/recent/", views.ItemStatsView.as_view(), name="item-stats"),
    path("items/<str:item_id>/", views.ItemStatsDetailView.as_view(), name="item-stats-detail"),
]
