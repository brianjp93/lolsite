web: gunicorn --bind :5000 --workers 5 lolsite.wsgi:application
worker: celery -A lolsite worker --concurrency=12 --loglevel=INFO
beat: celery -A lolsite beat -l INFO

release: django-admin migrate --no-input
