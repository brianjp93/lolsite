from django import forms

from data.constants import Region


class SummonerSearchForm(forms.Form):
    search = forms.CharField(required=True)
    region = forms.ChoiceField(choices=[(x, x) for x in Region], required=True)
