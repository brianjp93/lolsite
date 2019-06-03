from django.template.response import TemplateResponse
from django.contrib.auth.decorators import login_required
from fun.models import InspirationalMessage

from data import constants
import json


def home(request, path=''):
    """Return basic home address and let react render the rest.
    """
    restrict_access = False

    user = request.user
    try:
        user_data = {
            'email': request.user.email,
            'is_email_verified': user.custom.is_email_verified,
        }
    except:
        user_data = {}

    data = {
        'queues': json.dumps(constants.QUEUES),
        'user': json.dumps(user_data),
    }
    if restrict_access:
        if request.user.is_authenticated:
            data['allow_access'] = True
        else:
            data['allow_access'] = False
    else:
        data['allow_access'] = True
    return TemplateResponse(request, 'layout/home.html', data)
