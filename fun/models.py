from django.db import models
from django.utils import timezone


class InspirationalMessage(models.Model):
    message = models.CharField(max_length=1024, blank=True, default='')
    hidden_message = models.CharField(max_length=256, default='', blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    author = models.CharField(max_length=128, default='', blank=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)

