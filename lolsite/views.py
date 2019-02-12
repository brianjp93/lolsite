from django.template.response import TemplateResponse


def home(request, path=''):
    """
    """
    return TemplateResponse(request, 'layout/home.html')