"""notification/viewsapi.py
"""
from rest_framework.response import Response
from rest_framework.decorators import api_view

from data import constants as dc
from notification.models import Notification
from notification.serializers import NotificationSerializer

from django.db.models import Count, Max


@api_view(["GET", "PUT"])
def notification(request, format=None):
    """Endpoint for retrieving and marking notifications as read.

    GET Parameters
    --------------
    match_id_list : int
    is_grouped : bool
    count_only : bool
        don't return data, just get a count.
    start : int
    end : int
    is_read : bool
        Get notifications that have or have not been marked as read.
    order_by : str

    PUT Parameters
    --------------
    notification_id_list : [int]
    is_read : bool
        - Mark the notifications as read or unread
            - True    -> read
            - False   -> unread
    match_id_list : [int]

    Returns
    -------
    Notification QuerySet

    """
    if request.method == "GET":
        match_id_list = request.GET.getlist("match_id_list[]")
        is_grouped = dc.get_null_bool(request.GET.get("is_grouped")) or False
        is_read = dc.get_null_bool(request.GET.get("is_read"))
        start = int(request.GET.get("start", 0))
        end = int(request.GET.get("end", 10))
        order_by = request.GET.get("order_by", "-created_date")
        count_only = dc.get_null_bool(request.GET.get("count_only", False)) or False
        data, status_code = get_notifications(
            request.user,
            match_id_list=match_id_list,
            is_grouped=is_grouped,
            start=start,
            end=end,
            order_by=order_by,
            is_read=is_read,
            count_only=count_only,
        )
    elif request.method == "PUT":
        notification_id_list = request.data.get("notification_id_list")
        is_read = request.data.get("is_read")
        match_id_list = request.data.get("match_id_list")

        data, status_code = mark_notifications(
            request.user,
            notification_id_list=notification_id_list,
            is_read=is_read,
            match_id_list=match_id_list,
        )
    else:
        data = {"message": "The request method is invalid.", "status": "INVALID_METHOD"}
        status_code = 403
    return Response(data, status=status_code)


def get_notifications(
    user,
    match_id_list=None,
    is_grouped=False,
    start=0,
    end=10,
    order_by="-created_date",
    is_read=None,
    count_only=False,
):
    """Get notifications for a user.

    Parameters
    ----------
    REFER TO : notification()

    Returns
    -------
    None

    """
    if abs(end - start) > 100:
        end = start + 100

    if user.is_authenticated:
        if is_grouped is True:
            query = user.notifications.all()
            if is_read in [True, False]:
                query = query.filter(is_read=is_read)
            query = query.values(
                "comment__match__id", "comment__match__game_creation", "comment__match___id",
            ).annotate(Max("comment__created_date"), Count("comment"),)
            if order_by == "-created_date":
                query = query.order_by("-comment__created_date__max")
            elif order_by == "created_date":
                query = query.order_by("comment__created_date__max")
            count = query.count()
            if count_only:
                data = {"data": count}
                status_code = 200
            else:
                query = query[start:end]
                data = {"data": query, "count": count}
                status_code = 200
        else:
            query = user.notifications.order_by(order_by)
            if match_id_list is not None:
                query = query.filter(comment__match__id__in=match_id_list)
            count = query.count()
            query = query[start:end]
            data = {
                "data": NotificationSerializer(query, many=True).data,
                "count": count,
                "status": "SUCCESS",
            }
            status_code = 200
    else:
        data = {"status": "NOT_LOGGED_IN", "message": "User is not logged in."}
        status_code = 400
    return data, status_code


def mark_notifications(
    user, notification_id_list=None, is_read=None, match_id_list=None
):
    """Mark notifications as read or unread.

    Parameters
    ----------
    REFER TO : notification()

    Returns
    -------
    data, status_code

    """
    is_read = dc.get_null_bool(is_read)
    if is_read is None:
        raise ValueError("is_read must be a bool")
    if notification_id_list is None and match_id_list is None:
        raise ValueError("notification_id_list or match_id_list must be provided")

    if notification_id_list is not None:
        query = Notification.objects.filter(
            user=user, id__in=notification_id_list, is_read=not is_read
        )
    elif match_id_list is not None:
        query = Notification.objects.filter(
            user=user, comment__match__id__in=match_id_list, is_read=not is_read
        )
    else:
        query = None

    if query is not None:
        count = query.count()
        for noti in query:
            noti.is_read = is_read
            noti.save()
        data = {
            # "data": NotificationSerializer(query, many=True).data,
            'count': count,
            "status": "NOTIFICATIONS_MARKED",
        }
        status_code = 200
    else:
        data = {"message": "Insufficient Parameters.", "status": "INVALID_REQUEST"}
        status_code = 400
    return data, status_code
