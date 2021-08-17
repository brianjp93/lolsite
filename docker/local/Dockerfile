FROM python:3.6-slim-buster
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt .

RUN apt-get update -y \
    && apt-get install -y build-essential gcc g++ python3-dev

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
