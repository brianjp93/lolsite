from celery.schedules import crontab
from .celery import app

app.conf.beat_schedule = {
    "pt-handle-name-changes": {
        "task": "match.tasks.handle_name_changes",
        "schedule": crontab(minute="0"),
    },
    "pt-handle-old-notifications": {
        "task": "notification.tasks.delete_old_notifications",
        "schedule": crontab(minute="1", hour="1"),
    },
    "pt-import-patch-data": {
        "task": "data.tasks.import_missing",
        "schedule": crontab(minute="10"),
    },
}
app.conf.timezone = "America/Denver"  # type: ignore
