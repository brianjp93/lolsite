"""lolsite/management/commands/rundev.py
"""
from __future__ import absolute_import
import subprocess
import requests
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
        try:
            r = requests.get("http://localhost:3000", timeout=1)
            if r.status_code == 200:
                print(
                    "A server is already running on port 3000.  Not running a new server\n"
                )
        except:
            if sys.platform in ["win32"]:
                start_command = "start react\\start"
                print("running start command -- {}".format(start_command))
                subprocess.call(start_command, shell=True)
            elif sys.platform in ["darwin"]:
                react_dir = os.path.join(base, "react")
                command_file = os.path.join(base, "react", "start.command")
                with open(command_file, "w") as command_f:
                    command_f.write(f"cd {react_dir}\nnpm run start")
                start_command = ["open", "-W", command_file]
                subprocess.Popen(start_command)
            else:
                print(
                    'sys.platform did not return "win32".  You may have to run `npm run start` in the react directory manually.'
                )

        with open(os.path.join(base, ".git", "logs", "HEAD")) as git_log:
            line = [line for line in git_log][-1]
            GIT_BUILD = line.split()[1][:7]
            with open(pathlib.PurePath(base, "gitbuild"), "w") as f:
                f.write(GIT_BUILD)

        print("Running normal runserver command.")
        super(Command, self).inner_run(*args, **options)
