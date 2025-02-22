ARG PYTHON_VERSION=3.13.0
FROM python:${PYTHON_VERSION}-alpine3.19
ENV PYTHONUNBUFFERED=1
ENV RIOT_API_TOKEN=""
ENV DJANGO_SETTINGS_MODULE=lolsite.settings_live
ENV AWS_KEY=""
ENV AWS_SECRET=""
ENV TAILWINDCSS_VERSION=v3.4.17

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev git

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt .
COPY release.sh /release.sh
RUN pip install uv
RUN uv pip install -r requirements.txt --system

COPY . .
RUN tailwindcss -i ./lolsite/static/src/main.css -o ./lolsite/static/src/output.css --minify
RUN python manage.py collectstatic --no-input

EXPOSE 8000
