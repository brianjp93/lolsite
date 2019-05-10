from django.template.response import TemplateResponse
from django.contrib.auth.decorators import login_required
from fun.models import InspirationalMessage

from data import constants
import json


def home(request, path=''):
    """Return basic home address and let react render the rest.
    """
    restrict_access = False

    data = {
        'queues': json.dumps(constants.QUEUES),
    }
    if restrict_access:
        if request.user.is_authenticated:
            data['allow_access'] = True
        else:
            data['allow_access'] = False
    else:
        data['allow_access'] = True
    return TemplateResponse(request, 'layout/home.html', data)
