from .settings import *
import os
from decouple import config
import socket
import dj_database_url

DEBUG = True

ALLOWED_HOSTS = []
BASE_URL = "http://localhost:3000"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

MIDDLEWARE = [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
] + MIDDLEWARE


# settings internal ips for docker
hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
INTERNAL_IPS = [ip[: ip.rfind(".")] + ".1" for ip in ips] + ["127.0.0.1", "10.0.2.2", "localhost"]

DATABASES = {'default': dj_database_url.config()}

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

def show_toolbar(request):
    return True

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK" : show_toolbar,
}
