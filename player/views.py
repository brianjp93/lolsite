from datetime import timedelta
from functools import cached_property
import logging

from django.core.signing import BadSignature, SignatureExpired
from django.middleware.csrf import CsrfViewMiddleware
from django.views.decorators.csrf import csrf_protect
import requests

from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import generic
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.core.mail import send_mail

from data.models import Champion
from data.serializers import BasicChampionWithImageSerializer
from lolsite.helpers import query_debugger
from lolsite.tasks import get_riot_api
from match.models import Match, set_focus_participants, set_related_match_objects, sort_positions
from match.parsers.spectate import SpectateModel
from match.viewsapi import MatchBySummoner
from match import tasks as mt
from player.filters import SummonerAutocompleteFilter, SummonerMatchFilter
from player.models import EmailVerification, Favorite, Follow, NameChange, Summoner
from player.serializers import RankPositionSerializer, ReputationSerializer
from player.viewsapi import get_by_puuid
from player.forms import SignupForm, SummonerConnectForm
from player import tasks as pt
from stats.views import champion_stats_context
from lolsite.signers import ActivationSigner


logger = logging.getLogger(__name__)
User = get_user_model()



def send_verification_email(request, email):
    subject = "Hardstuck.club email verification"
    user = User.objects.get(email__iexact=email)
    signed = ActivationSigner.sign(str(user.pk))
    context = {
        "activation_url": request.build_absolute_uri(reverse("player:activate")) + f"?signed={signed}",
    }
    html_message = render_to_string("mail/activation.html", context)
    send_mail(
        subject,
        html_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=html_message,
    )


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


class SummonerProfileCard(generic.DetailView):
    template_name = "cotton/player/card.html"
    queryset = Summoner.objects.all()

    def get_context_data(self, **kwargs):
        pt.import_positions(self.object.id)
        context = super().get_context_data(**kwargs)
        context["summoner"] = self.object
        if self.request.user.is_authenticated:
            context["is_favorite"] = self.request.user.favorite_set.filter(summoner=self.object).exists()
            context["is_follow"] = self.request.user.follow_set.filter(summoner=self.object).exists()
        return context


class SummonerPage(generic.ListView):
    paginate_by: int = 10  # type: ignore
    template_name = "player/summoner.html"

    def get_context_data(self, *args, **kwargs):
        page = int(self.request.GET.get('page', 1))
        queue = self.request.GET.get('queue', None)
        queue = int(queue) if queue else None
        limit = self.paginate_by
        start = limit * (page - 1)
        if page == 1:
            mt.bulk_import.s(self.summoner.puuid, count=100, offset=start + limit).apply_async()

        context = super().get_context_data(*args, **kwargs)
        context.update(champion_stats_context(self.summoner.puuid))
        context["summoner"] = self.summoner
        context["filterset"] = self.filterset
        if self.request.user.is_authenticated:
            context["is_favorite"] = self.request.user.favorite_set.filter(summoner=self.summoner)
            context["is_follow"] = self.request.user.follow_set.filter(summoner=self.summoner)
        self.request.user
        context["namechanges"] = NameChange.objects.filter(
            summoner=self.summoner,
        ).order_by("-created_date")
        set_related_match_objects(context['object_list'])
        set_focus_participants(context["object_list"], self.summoner.puuid)
        return context

    @cached_property
    def summoner(self):
        if puuid := self.kwargs.get("puuid"):
            return Summoner.objects.get(puuid=puuid)
        name = self.kwargs["name"]
        tagline = self.kwargs["tagline"]
        region = self.kwargs["region"]
        return MatchBySummoner.get_summoner(name, tagline, region)

    @cached_property
    def filterset(self):
        return SummonerMatchFilter(
            self.request.GET,
            Match.objects.all(),
            puuid=self.summoner.puuid,
        )

    def get_queryset(self):
        qs = self.filterset.qs
        qs = qs.prefetch_related("participants", "participants__stats", "teams__bans")
        qs = qs.order_by("-game_creation")
        return qs


class SummonerMatchList(generic.ListView):
    paginate_by: int = 10  # type: ignore
    template_name = "player/_matchlist.html"

    def get_context_data(self, *args, **kwargs):
        page = int(self.request.GET.get('page', 1))
        queue = self.request.GET.get('queue', None)
        played_with = self.request.GET.get('played_with', None)
        champion = self.request.GET.get('champion', None)
        queue = int(queue) if queue else None
        limit = self.paginate_by
        start = limit * (page - 1)
        end = start + limit
        do_riot_api_request = not (played_with or champion)
        if do_riot_api_request:
            mt.import_recent_matches(
                start,
                end,
                self.summoner.puuid,
                self.summoner.region,
                queue,
            )
        context = super().get_context_data(*args, **kwargs)
        context["summoner"] = self.summoner
        self.request.user
        set_related_match_objects(context['object_list'])
        set_focus_participants(context["object_list"], self.summoner.puuid)
        return context

    @cached_property
    def summoner(self):
        puuid = self.kwargs["puuid"]
        return Summoner.objects.get(puuid=puuid)

    @cached_property
    def filterset(self):
        return SummonerMatchFilter(
            self.request.GET,
            Match.objects.all(),
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
                "tagline": "".join(summoner.riot_id_tagline.split()),
            },
        )


class SpectateView(generic.TemplateView):
    template_name = "player/_spectate.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = self.fetch_spectate_data(kwargs['puuid'], kwargs['region'])
        context.update({'spectate': data})
        return context

    def fetch_spectate_data(self, puuid, region):
        api = get_riot_api()
        r = api.spectator.get(puuid, region)
        if r.status_code == 404:
            return None
        else:
            parsed = SpectateModel.model_validate_json(r.content)
            mt.import_spectate_from_data(parsed, region)
            summoners = mt.import_summoners_from_spectate(parsed, region)

            for x in summoners.values():
                pt.import_positions(x, threshold_days=3)

            spectate_data = parsed.model_dump()
            for part in spectate_data["participants"]:
                positions = None
                query = Summoner.objects.filter(region=region, puuid=part["puuid"])
                if summoner := summoners.get(part["puuid"]):
                    checkpoint = summoner.get_newest_rank_checkpoint()
                    if checkpoint:
                        positions = RankPositionSerializer(
                            checkpoint.positions.filter(queue_type="RANKED_SOLO_5x5"), many=True
                        ).data
                    else:
                        positions = []
                    positions = sort_positions(positions)
                part["positions"] = positions

                query = Champion.objects.filter(key=part["championId"]).order_by(
                    "-version"
                ).select_related('image')
                if champion := query.first():
                    part['champion'] = BasicChampionWithImageSerializer(champion).data
            spectate_data["team100"] = [x for x in spectate_data['participants'] if x['teamId'] == 100]
            spectate_data["team200"] = [x for x in spectate_data['participants'] if x['teamId'] != 100]
            return spectate_data


class SignupView(generic.CreateView):
    form_class = SignupForm
    template_name = "registration/signup.html"
    success_url = reverse_lazy("player:account-created")

    def get_context_data(self, **kwargs):
        return super().get_context_data(**kwargs) | {
            "GOOGLE_RECAPTCHA_KEY": settings.GOOGLE_RECAPTCHA_KEY,
        }

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("home")
        return super().dispatch(request, *args, **kwargs)

    @transaction.atomic
    def form_valid(self, form):
        token = self.request.POST.get("g-recaptcha-response", "")
        email = form.cleaned_data['email']
        response = requests.post(
            f'https://recaptchaenterprise.googleapis.com/v1/projects/{settings.GOOGLE_RECAPTCHA_PROJECT_ID}/assessments?key={settings.GOOGLE_RECAPTCHA_API_KEY}',
            json={
                "event": {
                    "token": token,
                    "siteKey": settings.GOOGLE_RECAPTCHA_KEY,
                    "expectedAction": "SIGNUP"
                }
            }
        )
        score = response.json()['riskAnalysis']['score']
        logger.info(f'Got {score=} for signup: {email}')
        transaction.on_commit(lambda: send_verification_email(self.request, email))
        return super().form_valid(form)


class EmailActivationView(generic.TemplateView):
    template_name = "registration/activation.html"

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        signed = self.request.GET.get("signed", "")
        try:
            user_id = ActivationSigner.unsign(signed, max_age=timedelta(days=60))
        except SignatureExpired:
            context["type"] = "signature_expired"
            user_id = signed.split(":")[0]
            user = User.objects.filter(id=user_id).first()
            if user:
                send_verification_email(self.request, user.email)
        except BadSignature:
            context["type"] = "bad_signature"
        else:
            context["type"] = "success"
            user = User.objects.filter(id=user_id).first()
            user.is_active = True
            user.save()
        return context


class FavoriteView(generic.TemplateView, CsrfViewMiddleware):
    template_name = "player/_favorite.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        summoner_id = self.request.POST.get("summoner_id")
        context["summoner"] = Summoner.objects.get(pk=summoner_id)
        if self.request.user.is_authenticated:
            context["is_favorite"] = self.request.user.favorite_set.filter(summoner__id=summoner_id).exists()
            context["favorites_list"] = [x.summoner for x in self.request.user.favorite_set.order_by("sort_int")]
        return context


    def post(self, request, *args, **kwargs):
        summoner_id = request.POST.get("summoner_id")
        is_favorite = request.POST.get("is_favorite")
        summoner = get_object_or_404(Summoner, id=summoner_id)
        if is_favorite:
            Favorite.objects.update_or_create(user=self.request.user, summoner=summoner)
        else:
            Favorite.objects.filter(user=self.request.user, summoner=summoner).delete()
        return render(request, self.get_template_names(), self.get_context_data())


class FollowView(generic.TemplateView, CsrfViewMiddleware):
    template_name = "player/_follow.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        summoner_id = self.request.POST.get("summoner_id")
        context["summoner"] = Summoner.objects.get(pk=summoner_id)
        if self.request.user.is_authenticated:
            context["is_follow"] = self.request.user.follow_set.filter(summoner_id=summoner_id).exists()
        return context

    def post(self, request, *args, **kwargs):
        summoner_id = request.POST.get("summoner_id")
        is_follow = request.POST.get("is_follow")
        summoner = get_object_or_404(Summoner, id=summoner_id)
        if is_follow:
            obj, _ = Follow.objects.update_or_create(user=self.request.user, summoner=summoner)
        else:
            Follow.objects.filter(user=self.request.user, summoner=summoner).delete()
        return render(request, self.get_template_names(), self.get_context_data())


def played_with_count(request, puuid):
    summoner = get_object_or_404(Summoner, puuid=puuid)
    count = ReputationSerializer.user_has_match_overlap(request.user, summoner)
    return render(request, "cotton/player/played_with_count.html", {'count': count})


class MyAccountView(LoginRequiredMixin, generic.DetailView):
    template_name = "player/account.html"

    def get_object(self, queryset=None):
        return self.request.user

    @method_decorator(csrf_protect)
    def post(self, request, *args, **kwargs):
        summonerlink_id = request.POST["summonerlink_id"]
        action = request.POST["action"]
        match action:
            case "delete":
                request.user.summonerlinks.filter(id=summonerlink_id).delete()
                messages.success(request, "Cancelled summoner-connection request.")
            case "confirm":
                # do confirm stuff
                summonerlink = request.user.summonerlinks.filter(id=summonerlink_id).first()
                messages.success(request, f"Confirmed summoner-connection for {summonerlink.summoner.get_name()}")
                pass
            case _:
                messages.error(request, "action can only be confirm or delete")
        return redirect("player:account")


class SummonerConnectFormView(LoginRequiredMixin, generic.CreateView):
    template_name = "player/connect-summoner.html"
    form_class = SummonerConnectForm
    success_url = reverse_lazy("player:account")

    def get_form_kwargs(self):
        return super().get_form_kwargs() | {"user": self.request.user}
