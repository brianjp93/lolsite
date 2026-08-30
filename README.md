# LoL Site

Another league of legends match history and stats site.

## Dokku deploys

`.buildpacks` runs Node before Python. `bin/post_compile` builds `frontend/`
before Django collects its static assets.
