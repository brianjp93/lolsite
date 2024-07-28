from django.views.generic import DetailView

from match.models import Match
from match import tasks as mt


class MatchDetailView(DetailView):
    template_name = "match/match-detail.html"
    model = Match
    queryset = Match.objects.all().prefetch_related(
        "participants",
        "participants__stats",
    )
    slug_field = "_id"

    def get_object(self, queryset=None):
        match = super().get_object(queryset)
        if not getattr(match, 'advancedtimeline', None):
            mt.import_advanced_timeline(match.id)
        return match
