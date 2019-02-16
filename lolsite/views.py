from django.template.response import TemplateResponse
from fun.models import InspirationalMessage


def home(request, path=''):
    """Return basic home address and let react render the rest.
    """
    return TemplateResponse(request, 'layout/home.html')
