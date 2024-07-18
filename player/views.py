"""player/views.py"""

from functools import cached_property
import urllib.parse

from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.utils import timezone
from django.views import generic

from match.models import Match
from match.viewsapi import MatchBySummoner
from match import tasks as mt
from player.filters import SummonerMatchFilter
from player.models import EmailVerification
from player.viewsapi import get_by_puuid


def get_page_urls(request, query_param='page'):
    page = int(request.GET.get(query_param, 1))
    base_path = request.path
    search = request.GET.copy()
    next_page_params = search.copy()
    next_page_params['page'] = str(page + 1)

    prev_page_params = search.copy()
    prev_page_params['page'] = str(page - 1)

    next_url = base_path + "?" + urllib.parse.urlencode(next_page_params)
    prev_url = base_path + "?" + urllib.parse.urlencode(prev_page_params)
    return prev_url, next_url


def login_action(request):
    """Login

    POST Parameters
    ---------------
    email : str
    password : str

    Returns
    -------
    JSON

    """
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        user = authenticate(request, username=email, password=password)
        if user is not None:
            if user.custom.is_email_verified:
                login(request, user)
                view_name = "home"
            else:
                view_name = "/login?error=verification"
                thresh = timezone.now() - timezone.timedelta(minutes=10)
                query = user.emailverification_set.filter(created_date__gt=thresh)
                if query.exists():
                    # recent emailverification models exist
                    # don't need to create a new one
                    pass
                else:
                    # Create new email verification model.
                    EmailVerification(user=user).save()
        else:
            view_name = "/login?error=true"
    else:
        view_name = "/login"

    return redirect(view_name)


def logout_action(request):
    """Log user out of session."""
    # user = request.user
    logout(request)
    return redirect("home")


class SummonerPage(generic.ListView):
    paginate_by: int = 10  # type: ignore
    template_name = "player/summoner.html"

    def get_context_data(self, *args, **kwargs):
        region = self.kwargs['region']
        page = int(self.request.GET.get('page', 1))
        queue = self.request.GET.get('queue', None)
        limit = self.paginate_by
        start = limit * (page - 1)
        end = start + limit
        mt.import_recent_matches(
            start,
            end,
            self.summoner.puuid,
            region,
            queue,
        )
        if page == 1:
            mt.bulk_import.s(self.summoner.puuid, count=40, offset=start + limit).apply_async(countdown=2)

        context = super().get_context_data(*args, **kwargs)
        prev_url, next_url = get_page_urls(self.request)
        context['next_url'] = next_url
        context['prev_url'] = prev_url
        context["summoner"] = self.summoner
        context["filterset"] = self.filterset
        self.set_related_objects(context["object_list"])
        self.set_focus_participants(context["object_list"])
        return context


    def set_focus_participants(self, object_list: list):
        for obj in object_list:
            obj.focus = None
            for part in obj.participants.all():
                if part.puuid == self.summoner.puuid:
                    obj.focus = part

    def set_related_objects(self, object_list: list):
        matches = Match.objects.filter(id__in=[x.id for x in object_list])
        matches = matches.prefetch_related("participants", "participants__stats")
        related = matches.get_related()
        for obj in object_list:
            for part in obj.participants.all():
                part.items = []
                keys = [
                    "item_0",
                    "item_1",
                    "item_2",
                    "item_3",
                    "item_4",
                    "item_5",
                    "item_6",
                ]
                for key in keys:
                    setattr(part, key, None)

                for key in keys:
                    if item_id := getattr(part.stats, key):
                        item = related["items"].get(item_id)
                        setattr(part, key, item)
                        part.items.append(item)
                    else:
                        part.items.append(None)
                if part.items:
                    part.items.pop()

                # champion
                part.champion = related["champions"].get(part.champion_id, None)

                part.spell_1 = related['spells'].get(part.summoner_1_id)
                part.spell_2 = related['spells'].get(part.summoner_2_id)

    @cached_property
    def summoner(self):
        name = self.kwargs["name"]
        tagline = self.kwargs["tagline"]
        region = self.kwargs["region"]
        return MatchBySummoner.get_summoner(name, tagline, region)

    @cached_property
    def filterset(self):
        return SummonerMatchFilter(
            self.request.GET,
            Match.objects.all(),
            region=self.kwargs["region"],
            puuid=self.summoner.puuid,
        )

    def get_queryset(self):
        qs = self.filterset.qs
        qs = qs.prefetch_related("participants", "participants__stats")
        qs = qs.order_by("-game_creation")
        return qs


class SummonerLookup(generic.View):
    def get(self, request, *args, **kwargs):
        search = request.GET.get("search")
        region = "na"
        if "#" in search:
            name, tagline = search.split("#")
        else:
            name = search
            tagline = "na1"
        summoner = MatchBySummoner.get_summoner(name, tagline, region)
        name, tagline = summoner.simple_riot_id.split("#")
        return redirect(
            "player:summoner-page",
            region=region,
            name=name,
            tagline=tagline,
        )


class SummonerPagePuuid(generic.RedirectView):
    def get_redirect_url(self, *args, **kwargs):
        puuid = self.kwargs["puuid"]
        summoner = get_by_puuid(puuid)
        return reverse(
            "player:summoner-page",
            kwargs={
                "region": summoner.region,
                "name": summoner.riot_id_name,
                "tagline": summoner.riot_id_tagline,
            },
        )
