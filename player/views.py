"""player/views.py
"""
from functools import cached_property
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from django.views import generic

from match.models import Match
from match.viewsapi import MatchBySummoner
from player.models import EmailVerification


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
    """Log user out of session.
    """
    # user = request.user
    logout(request)
    return redirect("home")


class SummonerPage(generic.ListView):
    paginate_by = 10
    template_name = "player/summoner.html"

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['object_list']
        context['summoner'] = self.summoner
        return context

    @cached_property
    def summoner(self):
        name = self.kwargs['name']
        tagline = self.kwargs['tagline']
        region = self.kwargs['region']
        return MatchBySummoner.get_summoner(name, tagline, region)

    def get_queryset(self):
        summoner = self.summoner
        qs = Match.objects.filter(participants__puuid=summoner.puuid)
        qs = qs.prefetch_related('participants', 'participants__stats')
        qs = qs.order_by('-game_creation')
        return qs
