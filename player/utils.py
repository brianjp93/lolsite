"""player/utils.py
"""
from django.contrib.auth.models import User


def get_admin():
    user: User | None = User.objects.filter(is_superuser=True).first()
    return user
