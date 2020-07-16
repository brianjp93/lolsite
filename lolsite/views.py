"""lolsite/views.py
"""
from django.template.response import TemplateResponse

from player.serializers import FavoriteSerializer

from data import tasks as dt
from data import constants

from notification import tasks as nt

import json
import logging

logger = logging.getLogger(__name__)


def home(request, path=""):
    """Return basic home address and let react render the rest.
    """
    dt.import_missing.delay()
    dt.compute_changes.delay(5)
    nt.delete_old_notifications.delay()
    user = request.user
    data = get_base_react_context(request, user=user)
    return TemplateResponse(request, "layout/home.html", data)


def get_base_react_context(request, user=None):
    """Get the react context data.
    """
    user_data = {}
    favorite_data = {}
    if user.is_authenticated:
        try:
            user_data = {
                "email": request.user.email,
                "is_email_verified": user.custom.is_email_verified,
                "id": user.id,
            }
        except Exception:
            logger.exception("Error while creating user_data dictionary")

        try:
            favorites = request.user.favorite_set.all().order_by("sort_int")
            favorite_data = FavoriteSerializer(favorites, many=True).data
        except Exception:
            logger.exception("Error while retrieving favorites for user.")

    data = {
        "queues": json.dumps(constants.QUEUES),
        "user": json.dumps(user_data),
        "favorites": json.dumps(favorite_data),
    }
    return data
