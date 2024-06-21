from .settings import *
import os
from decouple import config
import socket


REACT_DEV = config('REACT_DEV', False, cast=bool)
DEV = False
DEBUG = True


ALLOWED_HOSTS = ['*']
BASE_URL = "http://localhost:3000"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

MIDDLEWARE = [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
] + MIDDLEWARE


# settings internal ips for docker
hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
INTERNAL_IPS = [ip[: ip.rfind(".")] + ".1" for ip in ips] + ["127.0.0.1", "10.0.2.2"]


if config("DATABASE_URL", ''):
    import dj_database_url
    DATABASES = {'default': dj_database_url.config()}
else:
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

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
MEDIA_URL = "media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

REDIS_URL = config('REDIS_URL', 'localhost')
CELERY_BROKER_URL = f"redis://{REDIS_URL}"
CELERY_RESULT_BACKEND = f"redis://{REDIS_URL}"

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


CSRF_COOKIE_SAMESITE = "None"
SESSION_COOKIE_DOMAIN = 'localhost'
CSRF_TRUSTED_ORIGINS = ["http://localhost:8000", "http://localhost:3000"]
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
