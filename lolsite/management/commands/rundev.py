"""lolsite/management/commands/rundev.py
"""
from __future__ import absolute_import
import sys
import os
import pathlib

from django.contrib.staticfiles.management.commands.runserver import (
    Command as BaseRunserverCommand,
)
from django.conf import settings


class Command(BaseRunserverCommand):
    def inner_run(self, *args, **options):
        settings.REACT_DEV = True
        print("RUNNING PRE-RUNSERVER SCRIPT FOR DEV MODE")
        print(f"Platform detected: {sys.platform}")
        base = settings.BASE_DIR

        with open(os.path.join(base, ".git", "logs", "HEAD")) as git_log:
            line = [line for line in git_log][-1]
            GIT_BUILD = line.split()[1][:7]
            with open(pathlib.PurePath(base, "gitbuild"), "w") as f:
                f.write(GIT_BUILD)

        print("Running normal runserver command.")
        super(Command, self).inner_run(*args, **options)
