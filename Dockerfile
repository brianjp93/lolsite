From python:3.9.6-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/

RUN apt-get update -y \
    && apt-get install -y apt-transport-https curl \
    ca-certificates software-properties-common build-essential

RUN apt-get update -y \
    && apt-get install -y automake gcc g++ subversion python3-dev

RUN pip install -r requirements.txt
