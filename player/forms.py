from django import forms

from data.constants import Region


class SummonerSearchForm(forms.Form):
    search = forms.CharField(required=True, widget=forms.TextInput(attrs={"autocomplete": 'off'}))
    region = forms.ChoiceField(choices=[(x, x) for x in Region], required=True)
