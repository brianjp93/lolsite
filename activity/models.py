from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from activity.managers import HeartrateManager
from ext.activity import ACTIVITY
from ext.activity.api import ActivityAPIBase


User = get_user_model()


class ApplicationType(models.TextChoices):
    OURA = "OURA", _("Oura")


class Application(models.Model):
    code = models.CharField(choices=ApplicationType.choices, max_length=32, unique=True)
    client_id = models.CharField(max_length=32, default="")
    client_secret = models.CharField(max_length=32, default="")

    def __str__(self) -> str:
        return self.code

    @cached_property
    def api(self):
        api = ACTIVITY[self.code]()
        assert isinstance(api, ActivityAPIBase)
        return api

    def get_client_id(self):
        if self.client_id:
            return self.client_id
        elif client_id := getattr(settings, f"{self.code}_CLIENT_ID", ""):
            return client_id
        return ""

    def get_client_secret(self):
        if self.client_secret:
            return self.client_secret
        elif client_secret := getattr(settings, f"{self.code}_CLIENT_SECRET", ""):
            return client_secret
        return ""


class ApplicationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    access_token = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    refresh_token = models.CharField(max_length=64)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.access_token[:7] + "..."

    def refresh(self):
        application = self.application
        assert isinstance(application, Application)
        application.api.refresh(self.refresh_token, self.user)



class Heartrate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    bpm = models.IntegerField()
    dt = models.DateTimeField()

    objects: HeartrateManager = HeartrateManager()  # type: ignore

    class Meta:
        unique_together = [('user', 'dt')]


    def __str__(self) -> str:
        return f"{self.user} - {self.bpm}"
