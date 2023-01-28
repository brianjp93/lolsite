ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-setuptools \
    python3-wheel \
    curl

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt .
COPY release.sh /release.sh
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8080
