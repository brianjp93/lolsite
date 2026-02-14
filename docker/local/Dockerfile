FROM python:3.14-alpine
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
ENV UV_NO_DEV=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONFAULTHANDLER=1
ENV TAILWINDCSS_VERSION=v3.4.17
WORKDIR /code
COPY pyproject.toml uv.lock ./

RUN apk add --no-cache alpine-sdk gcc g++ python3-dev jpeg-dev zlib-dev

# Running uv run manage.py runserver results in semaphore leaks that I do not understand
# when I run the server directly with the system python, I do not run into the same issues,
# so I am installing to the system python rather than `uv sync` and `uv run`
RUN uv export > requirements.txt
RUN uv pip install -r requirements.txt --system
