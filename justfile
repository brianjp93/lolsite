pyright:
    uv run pyright
ruff:
    uv run ruff check
run:
    docker compose up
build *args:
    docker compose build {{args}}
