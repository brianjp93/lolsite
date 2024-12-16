FROM python:3.13.0-alpine3.19
ENV PYTHONUNBUFFERED=1
ENV PYTHONFAULTHANDLER=1
WORKDIR /code
COPY requirements.txt .

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev

RUN pip install --upgrade pip
RUN pip install uv
RUN uv pip install -r requirements.txt --system
