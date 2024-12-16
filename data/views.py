from django.shortcuts import render
from django.views import generic
from django_filters.views import FilterView


from data.models import Item
from data.filters import ItemFilter


class ItemStatsView(FilterView):
    model = Item
    template_name = "data/item-stats.html"
    filterset_class = ItemFilter

    def get_queryset(self):
        return Item.objects.filter(
            version=Item.objects.order_by("-major", "-minor").values("version")[:1],
            maps__key=11,
            language="en_US",
            in_store=True,
            required_champion="",
            gold__total__gt=0,
            gold__purchasable=True,
        ).select_related("gold", "image").order_by("-gold__total")
