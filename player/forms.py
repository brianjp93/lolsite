from django import forms
from django.contrib.auth import get_user_model

from data.constants import Region


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
