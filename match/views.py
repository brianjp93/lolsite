from typing import Iterable
from django.views.generic import DetailView
from django.db.models.query import prefetch_related_objects

from data.constants import STRUCTURES
from match.models import Frame, Match, Participant, set_related_match_objects
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
        for i, frame in enumerate(match.advancedtimeline.frames.all()):
            frame.idx = i
        context['frames'] = self.augment_timeline(match.advancedtimeline.frames.all())
        context['serialized_participants'] = self.basic_participant_serializer(match.participants.all())
        context['structures'] = STRUCTURES
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
                'team_id': x.team_id,
                'name': x.get_name(),
            }
            for x in participants
        }

    @staticmethod
    def augment_timeline(frames: Iterable[Frame]):
        """Augment timeline data with tower state information."""
        serialized_frames = FrameSerializer(frames, many=True).data
        tower_state = {
            'bt1_top': True,
            'bt1_mid': True,
            'bt1_bot': True,
            'bt2_top': True,
            'bt2_mid': True,
            'bt2_bot': True,
            'bt3_top': True,
            'bt3_mid': True,
            'bt3_bot': True,
            'bi_top': True,
            'bi_mid': True,
            'bi_bot': True,
            'bn1': True,
            'bn2': True,
            'rt1_top': True,
            'rt1_mid': True,
            'rt1_bot': True,
            'rt2_top': True,
            'rt2_mid': True,
            'rt2_bot': True,
            'rt3_top': True,
            'rt3_mid': True,
            'rt3_bot': True,
            'ri_top': True,
            'ri_mid': True,
            'ri_bot': True,
            'rn1': True,
            'rn2': True,
        }
        for frame in serialized_frames:
            for event in frame['buildingkillevents']:
                key = ''
                if event['team_id'] == 100:
                    key += 'b'
                elif event['team_id'] == 200:
                    key += 'r'

                if event['tower_type'] == 'NEXUS_TURRET':
                    key += 'n1'
                    if key in tower_state:
                        if not tower_state[key]:
                            key = key[:2] + '2'
                        tower_state[key] = False
                    continue

                if event['building_type'] == 'INHIBITOR_BUILDING':
                    key += 'i_'
                elif event['building_type'] == 'TOWER_BUILDING':
                    key += 't'
                    if event['tower_type'] == 'OUTER_TURRET':
                        key += '1_'
                    elif event['tower_type'] == 'INNER_TURRET':
                        key += '2_'
                    elif event['tower_type'] == 'BASE_TURRET':
                        key += '3_'

                if event['lane_type'] == 'TOP_LANE':
                    key += 'top'
                elif event['lane_type'] == 'MID_LANE':
                    key += 'mid'
                elif event['lane_type'] == 'BOT_LANE':
                    key += 'bot'

                if key in tower_state:
                    tower_state[key] = False
            frame['tower_state'] = tower_state.copy()
        return serialized_frames
