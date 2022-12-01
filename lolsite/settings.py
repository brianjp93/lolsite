"""
Django settings for lolsite project.

Generated by 'django-admin startproject' using Django 2.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""
import os
from decouple import config
import logging
# must be imported for app to know about periodic task schedule
from lolsite import periodic_tasks  # noqa: F401

logger = logging.getLogger(__name__)


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECRET_KEY = config(
    "LOLSITE_SECRET_KEY", "6cs%&oj!lvxpvj44r63-#ie=-%er1hs@%sbt1k9=lf7-b_mlxv"
)

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'lolsite.helpers.Paginator'
}

VERSION_STRING = '0.1.0'

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "django_extensions",
    "rest_framework",
    "storages",
    'core',
    "lolsite",
    "data",
    "match",
    "player",
    "fun",
    "pro",
    "notification",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "corsheaders.middleware.CorsPostCsrfMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "lolsite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": ["templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "lolsite.context_processors.version_processor",
            ],
        },
    },
]

WSGI_APPLICATION = "lolsite.wsgi.application"


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",},
]


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True


STATICFILES_DIRS = []


CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SAMESITE = None
CSRF_COOKIE_SAMESITE = None
CSRF_COOKIE_SECURE = True

CORS_ALLOW_HEADERS = (
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "user-agent",
    "x-requested-with",
    "accept",
    "origin",
    "x-csrftoken",
    "access-control-allow-credentials",
    "cookie",
)


CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"


# SENDGRID CONNECTION
EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_HOST_USER = "apikey"
EMAIL_HOST_PASSWORD = config("LOLSITE_EMAIL_HOST_PASSWORD", "")
EMAIL_PORT = 587
EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = "brianjp93@gmail.com"

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

RIOT_API_TOKEN = config('RIOT_API_TOKEN')
