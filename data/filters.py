from django import forms

import django_filters
from data.models import Item


class ItemFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    # I want these choices to be here, but the logic for applying the ordering
    #   will exist in the view that uses the filter because gold_efficiency is not computed
    #   in the database.
    order_by = django_filters.ChoiceFilter(
        initial="-gold__total",
        label="Order By",
        empty_label=None,
        required=True,
        choices=[
            ("-gold__total", "Cost (high to low)"),
            ("gold__total", "Cost (low to high)"),
            ("-gold_efficiency_percent", "Gold Efficiency % (high to low)"),
            ("gold_efficiency_percent", "Gold Efficiency % (low to high)"),
        ],
        method="do_nothing",
    )
    stats = django_filters.MultipleChoiceFilter(
        choices=list(Item.stat_list.items()),
        widget=forms.CheckboxSelectMultiple,
        method="stats_filter",
    )

    class Meta:
        model = Item
        fields = ['name']

    def do_nothing(self, qs, _, value):
        return qs

    def stats_filter(self, queryset, _, value):
        queries = {}
        for stat in value:
            queries[f"{stat}__gt"] = 0
        queryset = queryset.filter(**queries)
        return queryset
