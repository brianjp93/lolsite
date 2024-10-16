ARG PYTHON_VERSION=3.13.0
FROM python:${PYTHON_VERSION}-alpine3.19
ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev git

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt .
COPY release.sh /release.sh
RUN pip install uv
RUN uv pip install -r requirements.txt --system

COPY . .
RUN tailwindcss -i ./lolsite/static/src/main.css -o ./lolsite/static/src/output.css --minify

EXPOSE 8000
