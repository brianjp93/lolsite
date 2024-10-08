from celery.schedules import crontab
from .celery import app

app.conf.beat_schedule = {
    "pt-handle-old-notifications": {
        "task": "notification.tasks.delete_old_notifications",
        "schedule": crontab(minute="1", hour="1"),
    },
    "pt-import-patch-data": {
        "task": "data.tasks.import_missing",
        "schedule": crontab(minute="10"),
    },
    "mt-huge-match-import": {
        "task": "match.tasks.huge_match_import_task",
        "schedule": crontab(hour="0,12"),
    }
}
app.conf.timezone = "America/Los_Angeles"  # type: ignore
