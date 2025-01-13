import time
import logging

from django.contrib import messages
from django.db.models import Exists, OuterRef
from django.shortcuts import redirect
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.vary import vary_on_headers

from match.models import Match, Participant, set_related_match_objects
from match.tasks import RefreshFeed
from player.models import Summoner


logger = logging.getLogger(__name__)


class Home(generic.TemplateView):
    template_name = "layout/home.html"


class FeedView(LoginRequiredMixin, generic.ListView):
    template_name = "player/feed.html"
    hx_template_name = "player/_feed.html"
    paginate_by = 20

    @vary_on_headers("hx-request")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_template_names(self):
        if self.request.htmx:
            return [self.hx_template_name]
        return super().get_template_names()

    def get_context_data(self, object_list=None, **kwargs):
        if self.request.htmx:
            user = self.request.user
            rf = RefreshFeed()
            logger.info(f"Refreshing feed for {user=}")
            rf.refresh(user)
            while not rf.is_refresh_feed_done(user):
                time.sleep(0.5)
        context = super().get_context_data(object_list=object_list, **kwargs)
        context["following"] = self.following
        context["following_puuids"] = [x.puuid for x in self.following]
        set_related_match_objects(context["object_list"])
        return context

    def get_queryset(self):
        self.following = Summoner.objects.filter(
            id__in=self.request.user.follow_set.all().values("summoner_id")
        )
        return (
            Match.objects.filter(
                Exists(
                    Participant.objects.filter(
                        puuid__in=self.following.values("puuid"),
                        match_id=OuterRef("id"),
                    )
                )
            )
            .prefetch_related("participants", "participants__stats")
            .order_by("-game_creation")
        )


class FollowingListView(LoginRequiredMixin, generic.ListView):
    template_name = "player/following.html"

    def get_queryset(self):
        return Summoner.objects.filter(
            id__in=self.request.user.follow_set.all().values("summoner_id")
        )

    def get_context_data(self, object_list=None, **kwargs):
        context = super().get_context_data(object_list=object_list, **kwargs)
        context["count"] = self.get_queryset().count()
        return context

    def post(self, *args, **kwargs):
        summoner_id = self.request.POST["summoner_id"]
        count, _ = self.request.user.follow_set.filter(summoner_id=summoner_id).delete()
        messages.info(self.request, f"Successfully removed {count} summoners from your follow list.")
        return redirect("following")
