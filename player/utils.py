"""player/utils.py
"""
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Value
from django.db.models.functions import Replace, Lower, Concat


def get_admin():
    user: User | None = User.objects.filter(is_superuser=True).first()
    return user


SIMPLE_RIOT_ID_EXPR = Replace(Lower(Concat(models.F("riot_id_name"), Value('#'), models.F("riot_id_tagline"))), Value(" "), Value(""))
