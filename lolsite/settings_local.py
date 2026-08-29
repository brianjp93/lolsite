import os
import sys

import dj_database_url
from decouple import config

from . import settings as base_settings

for setting_name in dir(base_settings):
    if setting_name.isupper():
        globals()[setting_name] = getattr(base_settings, setting_name)

DEBUG = True

ALLOWED_HOSTS = ["*"]
BASE_URL = "http://localhost:8000"
BACKEND_URL = BASE_URL
REACT_PROXY_URL = config("REACT_PROXY_URL", "http://localhost:3000")
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

if "test" not in sys.argv and DEBUG:
    MIDDLEWARE = [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ] + base_settings.MIDDLEWARE
    INSTALLED_APPS = [*base_settings.INSTALLED_APPS, "debug_toolbar"]


DATABASES = {"default": dj_database_url.config()}

FRONTEND_STATIC_DIR = base_settings.FRONTEND_PUBLIC
STATICFILES_DIRS = ["lolsite/static", FRONTEND_STATIC_DIR]

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(base_settings.BASE_DIR, "static")
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(base_settings.BASE_DIR, "media")

REDIS_URL = config("REDIS_URL", "localhost")
CELERY_BROKER_URL = f"redis://{REDIS_URL}"
CELERY_RESULT_BACKEND = f"redis://{REDIS_URL}/0"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        "LOCATION": "lolsite-dev-cache",
    }
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "[{asctime}][{levelname}] {filename}:{funcName}:{lineno} :: {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}


CSRF_COOKIE_SAMESITE = "None"
SESSION_COOKIE_DOMAIN = "localhost"
CSRF_TRUSTED_ORIGINS = ["http://localhost:8000", "http://localhost:3000"]
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]


def show_toolbar(request):
    return DEBUG


DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": show_toolbar,
}
AUTH_PASSWORD_VALIDATORS = []
