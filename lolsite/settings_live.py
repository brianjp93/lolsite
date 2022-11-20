from .settings import *

from decouple import config
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
import dj_database_url


REACT_DEV = False
DEV = False
DEBUG = False


ALLOWED_HOSTS = ["hardstuck.club"]
BASE_URL = "https://hardstuck.club"

ENVNAME = config("ENVNAME", None)
DATABASES = {'default': dj_database_url.config()}

AWS_ACCESS_KEY_ID = config("AWS_KEY")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET")

# aws settings
AWS_STORAGE_BUCKET_NAME = "lolsite-static"
AWS_DEFAULT_ACL = "public-read"
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3-us-west-2.amazonaws.com"
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
# s3 static settings
STATICFILES_LOCATION = "static"
STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{STATICFILES_LOCATION}/"
STATICFILES_STORAGE = "custom_storages.StaticStorage"

MEDIAFILES_LOCATION = "media"
MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{MEDIAFILES_LOCATION}/"
DEFAULT_FILE_STORAGE = "custom_storages.MediaStorage"

REDIS_URL = config('REDIS_URL', 'localhost')
CELERY_BROKER_URL = f"redis://{REDIS_URL}"
CELERY_RESULT_BACKEND = f"redis://{REDIS_URL}"
CSRF_TRUSTED_ORIGINS = ['https://hardstuck.club']

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
        'logfile': {
            'class': 'logging.FileHandler',
            'formatter': 'default',
            'filename': '/var/log/my.log',
        },
    },
    'root': {
        'handlers': ['console', 'logfile'],
        'level': 'INFO',
    },
}


def before_breadcrumb(crumb, hint):
    if crumb.get("category", None) == "django.security.DisallowedHost":
        return None
    return crumb


def before_send(event, hint):
    if event.get("logger", None) == "django.security.DisallowedHost":
        return None
    return event


sentry_sdk.init(
    dsn=config("SENTRY_DSN", ""),
    integrations=[DjangoIntegration()],
    before_breadcrumb=before_breadcrumb,
    before_send=before_send,
)
