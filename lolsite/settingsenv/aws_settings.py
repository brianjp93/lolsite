"""lolsite/settingsenv/aws_settings.py
"""
import os

import requests
from decouple import config
import urllib.parse


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    with open(os.path.join(os.path.dirname(BASE_DIR), "env"), "rb") as env_file:
        for line in env_file:
            line = line.strip()
            if line == "":
                continue
            line = line.split("export ")[1]
            key = line.split("=")[0]
            value = "".join(line.split("=")[1:]).strip('"')
            config[key] = value
except:
    # print('Unable to set environment variables through env bash script')
    pass

REACT_DEV = False
DEV = False
DEBUG = False


def get_ec2_instance_ip():
    """Try to obtain the IP address of the current EC2 instance in AWS
    """
    try:
        ip = requests.get(
            "http://169.254.169.254/latest/meta-data/local-ipv4", timeout=0.01
        ).text
    except requests.exceptions.ConnectionError:
        ip = None
    return ip


ec2_ip = get_ec2_instance_ip()
ALLOWED_HOSTS = [".elasticbeanstalk.com", ".hardstuck.club", ec2_ip]
# BASE_URL = 'http://lolsite.us-west-2.elasticbeanstalk.com'
BASE_URL = "https://hardstuck.club"

ENVNAME = config("ENVNAME", None)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": config("RDS_DB_NAME"),
        "USER": config("RDS_USERNAME"),
        "PASSWORD": config("RDS_PASSWORD"),
        "HOST": config("RDS_HOSTNAME"),
        "PORT": config("RDS_PORT"),
    }
}

AWS_ACCESS_KEY_ID = config("AWS_KEY")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET")

# aws settings
AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY
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


if "RDS_DB_NAME" in os.environ or ENVNAME in ["lolsite", "lolsite-beat"]:
    CELERY_BROKER_TRANSPORT_OPTIONS = {"region": "us-west-2"}
    CELERY_BROKER_URL = "sqs://{}:{}@".format(
        urllib.parse.quote(AWS_ACCESS_KEY_ID, safe=""),
        urllib.parse.quote(AWS_SECRET_ACCESS_KEY, safe=""),
    )


CACHES = {
    "default": {
        "BACKEND": "django_elastipymemcache.memcached.ElastiPyMemCache",
        "LOCATION": "lolsite.zcb1mj.cfg.usw2.cache.amazonaws.com:11211",
    }
}
