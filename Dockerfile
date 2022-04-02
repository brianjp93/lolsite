ARG PYTHON_VERSION=3.8
FROM python:${PYTHON_VERSION}

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-setuptools \
    python3-wheel \
    supervisor \
    curl \
    redis-server

RUN mkdir -p /app
WORKDIR /app

COPY requirements.txt .
COPY release.sh /release.sh
RUN pip install -r requirements.txt

WORKDIR /app/react
COPY react/package.json react/yarn.lock react/tsconfig.json .
COPY react/src src
COPY react/public public

ENV NODE_VERSION=16.14.2
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN corepack enable
RUN yarn set version berry
RUN yarn install
RUN yarn build

WORKDIR /app

COPY . .

EXPOSE 8080

ADD supervisor.conf /app/

CMD supervisord -c /app/supervisor.conf
