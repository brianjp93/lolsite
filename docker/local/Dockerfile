FROM python:3.14-alpine
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
ENV UV_NO_DEV=1
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONFAULTHANDLER=1
WORKDIR /code
COPY pyproject.toml uv.lock ./

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev jpeg-dev zlib-dev

RUN uv sync --locked
