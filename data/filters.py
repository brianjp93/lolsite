from django import forms

import django_filters
from data.models import Item


class ItemFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    stats = django_filters.MultipleChoiceFilter(
        choices=list(Item.stat_list.items()),
        widget=forms.CheckboxSelectMultiple,
        method="stats_filter",
    )
    # order_by = django_filters.ChoiceFilter(choices=[])

    class Meta:
        model = Item
        fields = ['name']

    def stats_filter(self, queryset, _, value):
        queries = {}
        for stat in value:
            queries[f"{stat}__gt"] = 0
        queryset = queryset.filter(**queries)
        return queryset
