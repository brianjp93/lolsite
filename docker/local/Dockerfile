FROM ghcr.io/astral-sh/uv:alpine
ENV UV_NO_DEV=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONFAULTHANDLER=1
ENV TAILWINDCSS_VERSION=v3.4.17
WORKDIR /code
COPY pyproject.toml uv.lock ./

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev jpeg-dev zlib-dev
RUN uv sync --locked
