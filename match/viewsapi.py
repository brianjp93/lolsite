from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Match
from .serializers import FullMatchSerializer


@api_view(['POST'])
def get_full_match(request, format=None):
    """Get match, including all related models.

    POST Parameters
    ---------------
    match_id : str
    
    Returns
    -------
    JSON Match Data

    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        match_id = request.data.get('match_id', None)
        if match_id is not None:
            query = Match.objects.filter(_id=match_id)
            if query.exists():
                match = query.first()
                serializer = FullMatchSerializer(match)
                data['data'] = serializer.data
            else:
                data['error'] = "match_id could not be found"
                status_code = 404
        else:
            data['error'] = "Must provide a match_id"
            status_code = 400
    return Response(data, status=status_code)
