"""notification/tasks.py
"""
from notification.models import Notification
from django.utils import timezone

from celery import task


@task(name="notification.tasks.delete_old_notifications")
def delete_old_notifications(days=60):
    """Delete all Notifications older than <days> days.

    Parameters
    ----------
    days : int

    Returns
    -------
    None

    """
    thresh = timezone.now() - timezone.timedelta(days=days)
    query = Notification.objects.filter(created_date__lt=thresh)
    query.delete()
