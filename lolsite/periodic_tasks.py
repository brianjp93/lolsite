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
    "pt-import-popular-accounts": {
        "task": "match.tasks.import_matches_for_popular_accounts",
        "schedule": crontab(minute="30"),
    }
}
app.conf.timezone = "America/Denver"  # type: ignore
