"""notification/viewsapi.py
"""
from rest_framework.response import Response
from rest_framework.decorators import api_view

from notification.models import Notification
from notification.serializers import NotificationSerializer


@api_view(["GET", "PUT"])
def notification(request, format=None):
    """Endpoint for retrieving and marking notifications as read.

    GET Parameters
    --------------
    None

    PUT Parameters
    --------------
    None

    Returns
    -------
    Notification QuerySet

    """
    if request.method == "GET":
        data, status_code = get_notifications()
    elif request.method == "PUT":
        notification_id_list = request.GET.get("notification_id_list", [])
        is_read = request.GET.get("")
        data, status_code = mark_notifications(
            request.user, notification_id_list, is_read
        )
    else:
        data = {"message": "The request method is invalid.", "status": "INVALID_METHOD"}
        status_code = 403
    return Response(data, status=status_code)


def get_notifications(
    user, match_id=None, is_grouped=False, start=0, end=10, order_by="-created_date"
):
    """Get notifications for a user.

    Parameters
    ----------
    user : User Model
    match_id : int
    is_grouped : bool
        show comments as groupings by match
    start : int
    end : int

    Returns
    -------
    None

    """
    pass


def mark_notifications(user, notification_id_list, is_read):
    """Mark notifications as read or unread.

    Parameters
    ----------
    user : User Model
    notification_id_list : [int]
    is_read : bool
        mark as read -> True
        mark as unread -> False

    Returns
    -------
    data, status_code

    """
    query = Notification.objects.filter(user=user, id__in=notification_id_list)
    for noti in query:
        noti.is_read = is_read
        noti.save()
    data = {
        "data": NotificationSerializer(query, many=True).data,
        "status": "NOTIFICATIONS_MARKED",
    }
    status_code = 200
    return data, status_code
