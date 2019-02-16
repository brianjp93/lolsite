from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import ProfileIcon
from match.models import Match, Participant, Stats
from match.models import Timeline, Team, Ban

from .serializers import ProfileIconSerializer


def get_summoner_page(request, format=None):
    """Get all data needed to render the basic summoner page.

    POST Parameters
    ---------------
    summoner_name : str
    region : str

    Returns
    -------
    JSON Data

    """
    pass


@api_view(['POST'])
def get_profile_icon(request, format=None):
    """

    POST Parameters
    ---------------
    profile_icon_id : str
    language : str

    Returns
    -------
    JSON Profile Icon Model

    """
    data = {}
    status_code = 200

    profile_icon_id = request.data.get('profile_icon_id', None)
    language = request.data.get('language', None)

    if request.method == 'POST':
        query = ProfileIcon.objects.filter(_id=profile_icon_id)
        if query.exists():
            query = query.order_by('-version')
            profile_icon = query.first()
            serializer = ProfileIconSerializer(profile_icon)
            data['data'] = serializer.data
        else:
            data['error'] = "Couldn't find a ProfileIcon with the id given."
            status_code = 404
    return Response(data, status=status_code)
