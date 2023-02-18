from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def version_processor(request):
    return {"app_version": settings.VERSION_STRING}
