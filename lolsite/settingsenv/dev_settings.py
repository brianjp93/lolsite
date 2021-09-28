"""lolsite/settingsenv/dev_settings.py
"""
import os
from decouple import config


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REACT_DEV = config('REACT_DEV', False, cast=bool)
DEV = False
DEBUG = True


ALLOWED_HOSTS = ['*']
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
REACT_URL = config('REACT_URL', None)
DOCKER_REACT_LINK = config('DOCKER_REACT_LINK', REACT_URL)


REDIS_URL = config('REDIS_URL', 'localhost')
CELERY_BROKER_URL = f"redis://{REDIS_URL}"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        # "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "lolsite-dev-cache",
    }
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[{asctime}][{levelname}] {filename}:{funcName}:{lineno} :: {message}',
            'style': "{",
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
