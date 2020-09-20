"""player/utils.py
"""
from django.contrib.auth.models import User


def get_admin():
    """Get admin user account.

    Returns
    -------
    User

    """
    return User.objects.filter(is_superuser=True).first()
