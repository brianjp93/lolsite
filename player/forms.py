from django import forms
from django.contrib.auth import get_user_model

from data.constants import Region
from player.models import Summoner, SummonerLink, get_simple_riot_id


User = get_user_model()


class SummonerSearchForm(forms.Form):
    search = forms.CharField(required=True, widget=forms.TextInput(attrs={"autocomplete": 'off'}))
    region = forms.ChoiceField(choices=[(x, x) for x in Region], required=True)


class SignupForm(forms.ModelForm):
    password_confirmation = forms.CharField()

    class Meta:
        model = User
        fields = ["email", "password", "password_confirmation"]
        widgets = {
            "password": forms.PasswordInput(),
            "password_confirmation": forms.PasswordInput(),
        }

    def clean_password_confirmation(self):
        password = self.cleaned_data["password"]
        password_confirmation = self.cleaned_data["password_confirmation"]
        if password != password_confirmation:
            raise forms.ValidationError("password fields did not match")
        return password_confirmation

    def clean_email(self):
        email = self.cleaned_data["email"].strip()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("This email already exists, try logging in.")
        return email

    def save(self, commit: bool = True):
        self.instance.username = self.instance.email
        self.instance.is_active = False
        self.instance.set_password(self.cleaned_data["password"])
        return super().save(commit)


class SummonerConnectForm(forms.ModelForm):
    riot_id_name = forms.CharField(required=True)
    riot_id_tagline = forms.CharField(required=True)
    region = forms.ChoiceField(choices=[(x, x) for x in Region], required=True)

    class Meta:
        model = SummonerLink
        fields = ["riot_id_name", "riot_id_tagline", "region"]

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop("user")
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        assert cleaned
        simple_riot_id = get_simple_riot_id(cleaned["riot_id_name"], cleaned["riot_id_tagline"])
        summoner = Summoner.objects.filter(simple_riot_id=simple_riot_id).first()
        if not summoner:
            raise forms.ValidationError("A summoner with this name, tagline and region was not found.")
        cleaned["summoner"] = summoner
        return cleaned

    def save(self, commit=True):
        self.instance.summoner = self.cleaned_data["summoner"]
        self.instance.user = self.user
        return super().save(commit)
