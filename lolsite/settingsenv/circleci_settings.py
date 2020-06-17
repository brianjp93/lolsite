"""lolsite/settingsenv/circleci_settings.py
"""
import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REACT_DEV = False
DEV = False
DEBUG = False

ALLOWED_HOSTS = ["localhost", "192.168.0.24"]
BASE_URL = "http://localhost:8000"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "cirecle_test",
        "USER": "postgres",
        "PASSWORD": "",
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
}

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")


CELERY_BROKER_URL = "redis://localhost"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache",}}
