from django.db.models import Exists, OuterRef
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from match.models import Match, Participant, set_related_match_objects
from player.models import Summoner


class Home(generic.TemplateView):
    template_name = "layout/home.html"


class FeedView(LoginRequiredMixin, generic.ListView):
    template_name = "player/feed.html"
    paginate_by = 20

    def get_context_data(self, object_list=None, **kwargs):
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
