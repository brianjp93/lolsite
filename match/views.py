from django.views.generic import DetailView

from match.models import Match, set_related_match_objects
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

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        part = None
        match = context['object']
        set_related_match_objects([match])
        if part_id :=  self.request.GET.get('focus', None):
            part = match.participants.filter(_id=part_id).first()
        if not part:
            part = match.participants.order_by('_id').first()
        context['focus'] = part
        return context
