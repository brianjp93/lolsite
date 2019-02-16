from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import InspirationalMessage
from .serializers import InspirationalMessageSerializer

from random import randint


@api_view(['POST'])
def get_inspirational_message(request, format=None):
    """Get inspirational message.
    """
    data = {}
    status_code = 200
    if request.method == 'POST':
        query = InspirationalMessage.objects.all().order_by('-created_date')
        if query.exists():
            if request.data.get('random', False):
                total = query.count()
                index = randint(0, total-1)
                insp = query[index]
                serializer = InspirationalMessageSerializer(insp)
                data['message'] = serializer.data
            else:
                insp = query.first()
                serializer = InspirationalMessageSerializer(insp)
                data['message'] = serializer.data
        else:
            data['message'] = {}
    return Response(data, status=status_code)