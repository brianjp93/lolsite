from django.views.generic import DetailView

from match.models import Match


class MatchDetailView(DetailView):
    template_name = "match/match-detail.html"
    model = Match
    queryset = Match.objects.all().prefetch_related(
        "participants",
        "participants__stats",
    )
    slug_field = "_id"
