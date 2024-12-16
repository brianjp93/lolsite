from django.db.models import Exists, OuterRef
from django_filters.views import FilterView


from data.models import Item, ItemMap
from data.filters import ItemFilter


class ItemStatsView(FilterView):
    model = Item
    template_name = "data/item-stats.html"
    filterset_class = ItemFilter

    def get_queryset(self):
        return (
            Item.objects.filter(
                version=Item.objects.order_by("-major", "-minor").values("version")[:1],
                language="en_US",
                required_champion="",
                gold__purchasable=True,
            )
            .annotate(
                is_rift=Exists(
                    ItemMap.objects.filter(
                        item_id=OuterRef("id"),
                        value=True,
                        key=11,
                    )
                )
            ).filter(
                is_rift=True,
            )
            .select_related("gold", "image")
            .order_by("-gold__total")
        )
