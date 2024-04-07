from django.urls import path
from data import viewsapi as data_views
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path("item/", data_views.get_item),
    path("item/diff/<int:item_id>/", data_views.get_item_diff),
    path("item/<int:_id>/<int:major>/<int:minor>/", data_views.SimpleItemRetrieveView.as_view()),
    path("items/<int:major>/<int:minor>/", data_views.SimpleItemListView.as_view()),
    path("items/", data_views.all_items),
    path("item-history/<slug:_id>/", data_views.get_item_history),
    path("reforged-runes/", data_views.get_reforged_runes),
    path("get-current-season/", data_views.get_current_season),
    path("champions/", data_views.get_champions),
    path("basic-champions/", data_views.BasicChampionView.as_view()),
    path("champion-spells/", data_views.get_champion_spells),
    path("static-url/", data_views.get_static_url, name='get-static-url'),
    path("media-url/", data_views.get_media_url, name='get-media-url'),
    path("queues/", data_views.get_queues, name='queues'),
    path("google-recaptcha-site-key/", data_views.get_google_recaptcha_site_key),
]

urlpatterns = format_suffix_patterns(urlpatterns)
