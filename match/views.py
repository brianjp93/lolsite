from django.views.generic import DetailView
from django.db.models.query import prefetch_related_objects

from match.models import Match, set_related_match_objects
from match import tasks as mt


class MatchDetailView(DetailView):
    template_name = "match/match-detail.html"
    model = Match
    queryset = Match.objects.all().prefetch_related(
        "participants",
        "participants__stats",
        "teams",
    )
    slug_field = "_id"

    def get_object(self, queryset=None):
        match = super().get_object(queryset)
        if not getattr(match, 'advancedtimeline', None):
            mt.import_advanced_timeline(match.id)
            match.refresh_from_db()
        return match

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        part = None
        match = context['object']
        prefetch_related_objects(
            [match],
            "advancedtimeline__frames__elitemonsterkillevent_set",
            "advancedtimeline__frames__buildingkillevent_set",
            "advancedtimeline__frames__championkillevent_set",
        )
        set_related_match_objects([match], match.advancedtimeline)
        options = {str(x._id): x for x in match.participants.all() if str(x._id)}
        context['timeline'] = match.advancedtimeline
        if part_id :=  self.request.GET.get('focus', None):
            part = options.get(part_id, None)
        if not part:
            part = next(iter(options.values()))
        context['focus'] = part
        return context
