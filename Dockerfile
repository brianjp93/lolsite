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
COPY . /code/


RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get update -y \
    && apt-get install -y nodejs
WORKDIR /code/react/
RUN npm install --global yarn@1.22.11
RUN yarn install
WORKDIR /code/
