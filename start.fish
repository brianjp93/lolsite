#!/usr/bin/fish

# starts django in `dev` mode, runs worker, runs react server

# postgres and redis-server must be running
# create session `lolsite`
# assumes venv `lolsite`
set path (pwd)
tmux new-session -c $path -d -s lolsite 'conda activate lolsite && python manage.py rundev'
tmux split-window -c $path -h 'conda activate lolsite && python manage.py celery'
tmux split-window -c "$path/react/" -v 'npm run start'
tmux a -t lolsite
