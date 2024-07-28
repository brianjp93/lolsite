ARG PYTHON_VERSION=3.12.2
FROM python:${PYTHON_VERSION}-slim-bullseye
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-setuptools \
    python3-wheel \
    git

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt .
COPY release.sh /release.sh
RUN pip install -r requirements.txt

COPY . .
RUN tailwindcss -i ./lolsite/static/src/main.css -o ./lolsite/static/src/output.css --minify

EXPOSE 8000
