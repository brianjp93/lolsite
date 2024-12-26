from django.db.models import Exists, OuterRef
from django_filters.views import FilterView
from django.views import generic


from data.models import Item, ItemMap
from data.filters import ItemFilter


class ItemStatsView(FilterView):
    model = Item
    template_name = "data/item-stats.html"
    filterset_class = ItemFilter

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(object_list=object_list, **kwargs)
        if objs := context["object_list"]:
            context["version"] = list(objs)[0].version
        return context

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
            )
            .filter(
                is_rift=True,
            )
            .select_related("gold", "image")
            .order_by("-gold__total")
        )


class ItemStatsDetailView(generic.ListView):
    template_name = "data/item-stats-detail.html"

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(object_list=object_list, **kwargs)
        context["item"] = context["object_list"][0] if context["object_list"] else None
        return context

    def get_queryset(self):
        item_id = self.kwargs["item_id"]
        qs = (
            (
                Item.objects.item_history()
                .filter(_id=item_id)
                .order_by("-major", "-minor", "-patch")
            )
            .select_related("gold", "image")
        )
        return qs
