"""lolsite/views.py
"""
from django.template.response import TemplateResponse

from player.serializers import FavoriteSerializer

from data import constants
import json


def home(request, path=''):
    """Return basic home address and let react render the rest.
    """
    user = request.user
    data = get_base_react_context(request, user=user)
    return TemplateResponse(request, 'layout/home.html', data)

def get_base_react_context(request, user=None):
    """Get the react context data.
    """
    try:
        user_data = {
            'email': request.user.email,
            'is_email_verified': user.custom.is_email_verified,
            'id': user.id,
        }
    except Exception as e:
        user_data = {}

    try:
        favorites = request.user.favorite_set.all().order_by('sort_int')
        favorite_data = FavoriteSerializer(favorites, many=True).data
    except Exception as e:
        print(e)
        favorite_data = []

    data = {
        'queues': json.dumps(constants.QUEUES),
        'user': json.dumps(user_data),
        'favorites': json.dumps(favorite_data)
    }
    return data
