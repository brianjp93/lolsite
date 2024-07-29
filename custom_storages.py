from storages.backends.s3boto3 import S3Boto3Storage, S3ManifestStaticStorage
from django.conf import settings


class StaticStorage(S3ManifestStaticStorage):
    location = settings.STATICFILES_LOCATION


class MediaStorage(S3Boto3Storage):
    location = settings.MEDIAFILES_LOCATION
