FROM python:3.12.2-slim-bullseye
ENV PYTHONUNBUFFERED=1
ENV PYTHONFAULTHANDLER=1
WORKDIR /code
COPY requirements.txt .

RUN apt-get update -y \
    && apt-get install -y build-essential gcc g++ python3-dev procps libcurl4-openssl-dev libssl-dev git

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
