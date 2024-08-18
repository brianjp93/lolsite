from typing import Iterable
from django.views.generic import DetailView
from django.db.models.query import prefetch_related_objects

from match.models import Match, Participant, set_related_match_objects
from match import tasks as mt
from match.serializers import FrameSerializer


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
            "advancedtimeline__frames__championkillevent_set__victimdamagereceived_set",
            "advancedtimeline__frames__championkillevent_set__victimdamagedealt_set",
            "advancedtimeline__frames__championspecialkillevent_set",
            "advancedtimeline__frames__wardkillevent_set",
            "advancedtimeline__frames__wardplacedevent_set",
            "advancedtimeline__frames__levelupevent_set",
            "advancedtimeline__frames__skilllevelupevent_set",
            "advancedtimeline__frames__itempurchasedevent_set",
            "advancedtimeline__frames__itemdestroyedevent_set",
            "advancedtimeline__frames__itemundoevent_set",
            "advancedtimeline__frames__itemsoldevent_set",
            "advancedtimeline__frames__turretplatedestroyedevent_set",
            "advancedtimeline__frames__participantframes",
            "participants",
            "participants__stats",
            "teams",
        )
        set_related_match_objects([match], match.advancedtimeline)
        options = {str(x._id): x for x in match.participants.all() if str(x._id)}
        context['timeline'] = match.advancedtimeline
        context['frames'] = FrameSerializer(match.advancedtimeline.frames.all(), many=True).data
        context['serialized_participants'] = self.basic_participant_serializer(match.participants.all())
        if part_id :=  self.request.GET.get('focus', None):
            part = options.get(part_id, None)
        if not part:
            part = next(iter(options.values()))
        context['focus'] = part
        return context

    @staticmethod
    def basic_participant_serializer(participants: Iterable[Participant]):
        return {
            x._id: {
                '_id': x._id,
                'champion': {
                    'name': x.champion and x.champion.name,
                    'key': x.champion and x.champion.key,
                    'image_url': x.champion and x.champion.image and x.champion.image.file and x.champion.image.file.url,
                },
                'name': x.get_name(),
            }
            for x in participants
        }
