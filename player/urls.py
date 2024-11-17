from django.urls import path, re_path, register_converter
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import TemplateView
from . import views


app_name = 'player'


class BoolConverter:
    regex = "[tT]rue|[fF]alse"

    def to_python(self, value):
        return value.lower() == 'true'

    def to_url(self, value):
        return 'true' if value else 'false'


register_converter(BoolConverter, "bool")


urlpatterns = [
    re_path(r"(?P<region>(?:na|eune|euw|jp|kr|lan|las|br|oce|tr|ru))/(?P<name>[^\-]+)-(?P<tagline>\w+)/$", views.SummonerPage.as_view(), name="summoner-page"),
    re_path(r"spectate/(?P<region>(?:na|eune|euw|jp|kr|lan|las|br|oce|tr|ru))/(?P<puuid>[^/]+)/$", views.SpectateView.as_view(), name="spectate"),
    path("lookup/", views.SummonerLookup.as_view(), name="summoner-lookup"),
    path("puuid/<str:puuid>/", views.SummonerPagePuuid.as_view(), name="summoner-puuid"),
    path("puuid/<str:puuid>/matchlist/", views.SummonerMatchList.as_view(), name="matchlist"),
    path("player/autocomplete/", views.SummonerAutoComplete.as_view(), name="summoner-autocomplete"),
    path("player/login/", LoginView.as_view(), name="login"),
    path("player/logout/", LogoutView.as_view(), name="logout-view"),
    path("player/signup/", views.SignupView.as_view(), name="signup"),
    path("player/activate/", views.EmailActivationView.as_view(), name="activate"),
    path("player/account-created/", TemplateView.as_view(template_name="registration/account_created.html"), name="account-created"),
    path("player/favorite/", views.FavoriteView.as_view(), name="favorite"),
]
