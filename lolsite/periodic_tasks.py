from celery.schedules import crontab
from .celery import app
import os


app.conf.beat_schedule = {
    "pt-handle-old-notifications": {
        "task": "notification.tasks.delete_old_notifications",
        "schedule": crontab(minute="1", hour="1"),
    },
    "pt-import-patch-data": {
        "task": "data.tasks.import_missing",
        "schedule": crontab(minute="10"),
    },
    # "mt-huge-match-import": {
    #     "task": "match.tasks.huge_match_import_task",
    #     "schedule": crontab(hour="0,12", minute="0"),
    # }
}

# don't run certain jobs in local dev
if os.getenv("DJANGO_SETTINGS_MODULE", "lolsite.settings_local") == 'lolsite.settings_local':
    app.conf.beat_schedule.pop("mt-huge-match-import", None)

app.conf.timezone = "America/Los_Angeles"  # type: ignore
