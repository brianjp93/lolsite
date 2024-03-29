from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Notification(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    comment = models.ForeignKey(
        "player.Comment", on_delete=models.CASCADE, related_name="notifications"
    )
    is_read = models.BooleanField(default=False, blank=True, db_index=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)
    modified_date = models.DateTimeField(default=timezone.now, blank=True)

    def save(self, *args, **kwargs):
        self.modified_date = timezone.now()
        super().save(*args, **kwargs)

    def get_match_id(self):
        return self.comment.match.id

    def external_id(self):
        return self.comment.match._id
