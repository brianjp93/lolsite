from rest_framework.response import Response
from rest_framework.decorators import api_view

from match.tasks import get_riot_api

from .models import Match
from .serializers import FullMatchSerializer


@api_view(['POST'])
def get_match_timeline(request, format=None):
    """Gets match timeline from Riot's API.

    This is a tunnel.

    POST Parameters
    ---------------
    match_id : ID
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
            r = api.match.timeline(match_id, region=region)
            if r.status_code == 429:
                time.sleep(10)
                r = api.match.timeline(match_id, region=region)
            data = {'data': r.json()}
    return Response(data, status=status_code)
