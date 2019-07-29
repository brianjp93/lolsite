"""lolsite/views.py
"""
from django.template.response import TemplateResponse

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
        }
    except Exception as e:
        user_data = {}

    data = {
        'queues': json.dumps(constants.QUEUES),
        'user': json.dumps(user_data),
    }
    return data
