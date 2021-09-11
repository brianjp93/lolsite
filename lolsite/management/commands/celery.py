"""lolsite/management/commands/celery.py
"""
from __future__ import absolute_import
import shlex
import subprocess
import sys

from django.core.management.base import BaseCommand
from django.utils import autoreload


def restart_celery():
    # cmd = 'pkill -f "celery worker"'
    platform = sys.platform
    if platform in ["win32"]:
        win_cmd = "taskkill /IM celery.exe /F"
        subprocess.call(win_cmd)
        win_cmd = "celery worker -A lolsite -l info -P gevent"
        subprocess.call(win_cmd, shell=True)
    elif platform in ["darwin", "linux"]:
        cmd = "pkill -f celery worker"
        subprocess.call(shlex.split(cmd))
        cmd = "celery worker -A lolsite -l info"
        subprocess.call(shlex.split(cmd))
    else:
        print(f"Autoreloading celery for platform {platform} not yet configured.")


class Command(BaseCommand):
    def handle(self, *args, **options):
        print("Starting celery worker with autoreload...")

        # For Django>=2.2
        autoreload.run_with_reloader(restart_celery)
