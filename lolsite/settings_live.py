from .settings import *

from decouple import config
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
import dj_database_url


DEBUG = False


ALLOWED_HOSTS = ["app.hardstuck.club"]
BASE_URL = "https://hardstuck.club"
BACKEND_URL = "https://app.hardstuck.club"

DATABASES = {'default': dj_database_url.config()}

AWS_ACCESS_KEY_ID = config("AWS_KEY")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET")

# aws settings
AWS_STORAGE_BUCKET_NAME = "lolsite-static"
AWS_DEFAULT_ACL = "public-read"
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3-us-west-2.amazonaws.com"
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "location": "media",
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

REDIS_URL = config('REDIS_URL', 'localhost')
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = f"{REDIS_URL}/0"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
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


CORS_ALLOWED_ORIGINS = ['https://hardstuck.club', 'https://dev.hardstuck.club']
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_DOMAIN = '.hardstuck.club'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_DOMAIN = 'hardstuck.club'
CSRF_TRUSTED_ORIGINS = [
    "https://hardstuck.club",
    "https://app.hardstuck.club",
    "https://dev.hardstuck.club",
]


def before_breadcrumb(crumb, hint):
    if crumb.get("category", None) == "django.security.DisallowedHost":
        return None
    return crumb


def before_send(event, hint):
    if event.get("logger", None) == "django.security.DisallowedHost":
        return None
    return event


sentry_sdk.init(
    dsn=config("SENTRY_DSN", ""),  # type: ignore
    integrations=[DjangoIntegration()],
    enable_tracing=True,
    before_breadcrumb=before_breadcrumb,
    before_send=before_send,
)
