"""lolsite/settingsenv/dev_settings.py
"""
import os
from decouple import config


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REACT_DEV = False
DEV = False
DEBUG = True


ALLOWED_HOSTS = ["localhost", "192.168.0.24", "127.0.0.1"]
BASE_URL = "http://localhost:8000"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("LOLSITE_DB_NAME"),
        "USER": config("LOLSITE_DB_USER"),
        "HOST": config("LOLSITE_DB_HOST"),
        "PORT": config("LOLSITE_DB_PORT"),
        "PASSWORD": config("LOLSITE_DB_PASS", ''),
    }
}

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")


CELERY_BROKER_URL = "redis://localhost"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}
