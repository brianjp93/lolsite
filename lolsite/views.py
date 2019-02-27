from django.template.response import TemplateResponse
from fun.models import InspirationalMessage

from data import constants
import json


def home(request, path=''):
    """Return basic home address and let react render the rest.
    """
    data = {
        'queues': json.dumps(constants.QUEUES),
    }
    return TemplateResponse(request, 'layout/home.html', data)
