from functools import cached_property
import urllib.parse

from django.http import Http404
from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.utils import timezone
from django.views import generic

from lolsite.helpers import query_debugger
from match.models import Match, set_focus_participants, set_related_match_objects
from match.viewsapi import MatchBySummoner
from match import tasks as mt
from player.filters import SummonerAutocompleteFilter, SummonerMatchFilter
from player.models import EmailVerification, NameChange
from player.viewsapi import get_by_puuid
from player import tasks as pt


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
        queue = int(queue) if queue is not None else None
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
            mt.bulk_import.s(self.summoner.puuid, count=100, offset=start + limit).apply_async(countdown=2)
            pt.import_positions(self.summoner.id)

        context = super().get_context_data(*args, **kwargs)
        prev_url, next_url = get_page_urls(self.request)
        context['next_url'] = next_url
        context['prev_url'] = prev_url
        context["summoner"] = self.summoner
        context["filterset"] = self.filterset
        context["namechanges"] = NameChange.objects.filter(
            summoner=self.summoner,
        ).order_by("-created_date")
        set_related_match_objects(context['object_list'])
        set_focus_participants(context["object_list"], self.summoner.puuid)
        return context

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
        search = request.GET.get("simple_riot_id")
        region = request.GET.get("region", "na")
        if "#" in search:
            name, tagline = search.split("#")
        else:
            name = search
            tagline = f"{region}1"
        try:
            summoner = MatchBySummoner.get_summoner(name, tagline, region)
        except Http404:
            return render(request, 'player/summoner_not_found.html')
        name, tagline = summoner.simple_riot_id.split("#")
        return redirect(
            "player:summoner-page",
            region=region,
            name=name,
            tagline=tagline,
        )

class SummonerAutoComplete(generic.ListView):
    template_name = "player/_summoner_autocomplete.html"
    paginate_by = 20

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['form'] = self.filterset.form
        context["partialId"] = self.request.GET.get('partialId')
        return context

    @property
    def filterset(self):
        return SummonerAutocompleteFilter(self.request.GET)

    def get_queryset(self):
        return self.filterset.qs


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
