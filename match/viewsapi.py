from rest_framework.response import Response
from rest_framework.decorators import api_view

from match.tasks import get_riot_api
from match import tasks as mt

from .models import Match
from .models import AdvancedTimeline, Frame, ParticipantFrame
from .models import Event, AssistingParticipants

from .serializers import FullMatchSerializer
from .serializers import AdvancedTimelineSerializer, FrameSerializer, ParticipantFrameSerializer
from .serializers import EventSerializer, AssistingParticipantsSerializer


@api_view(['POST'])
def get_match_timeline(request, format=None):
    """Gets match timeline from Riot's API.

    This is a tunnel.

    POST Parameters
    ---------------
    match_id : ID
        Riot's match ID
    region : str

    Returns
    -------
    JSON Timeline Data

    """
    required = ['match_id', 'region']
    data = {}
    status_code = 200
    api = get_riot_api()
    if api:
        match_id = request.data.get('match_id', None)
        region = request.data.get('region', None)
        if request.method == 'POST':
            match = Match.objects.get(_id=match_id)
            try:
                timeline = match.advancedtimeline
            except:
                mt.import_advanced_timeline(match.id)
                match.refresh_from_db()
                timeline = match.advancedtimeline

            timeline_data = []
            for frame in timeline.frames.all().order_by('timestamp'):
                frame_data = {
                    'timestamp': frame.timestamp,
                }
                participantframes = []
                for pframe in frame.participantframes.all():
                    try:
                        pos = pframe.position
                    except:
                        pos = None
                    pframe = {
                        'participant_id': pframe.participant_id,
                        'current_gold': pframe.current_gold,
                        # 'dominion_score': pframe.dominion_score,
                        'jungle_minions_killed': pframe.jungle_minions_killed,
                        'level': pframe.level,
                        'minions_killed': pframe.minions_killed,
                        'x': pframe.x,
                        'y': pframe.y,
                        'team_score': pframe.team_score,
                        'total_gold': pframe.total_gold,
                        'xp': pframe.xp,
                    }
                    participantframes.append(pframe)

                events = []
                for event in frame.events.all():
                    event_data = {
                        '_type': event._type,
                        'participant_id': event.participant_id,
                        'timestamp': event.timestamp,
                        'item_id': event.item_id,
                        'level_up_type': event.level_up_type,
                        'skill_slot': event.skill_slot,
                        'ward_type': event.ward_type,
                        'before_id': event.before_id,
                        'after_id': event.after_id,
                        'killer_id': event.killer_id,
                        'victim_id': event.victim_id,
                        'x': event.x,
                        'y': event.y,
                        'monster_type': event.monster_type,
                        'monster_sub_type': event.monster_sub_type,
                        'building_type': event.building_type,
                        'lane_type': event.building_type,
                        'team_id': event.team_id,
                        'tower_type': event.tower_type,
                        'assistingparticipants': [x.participant_id for x in event.assistingparticipants.all()]
                    }
                    events.append(event_data)

                frame_data['participantframes'] = participantframes
                frame_data['events'] = events
                timeline_data.append(frame_data)
            data = {'data': timeline_data}

    return Response(data, status=status_code)
