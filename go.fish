#!/usr/bin/fish

# starts django in `dev` mode, runs worker, runs react server

# postgres and redis-server must be running
# create session `lolsite`
# assumes venv `lolsite`
sudo service redis-server start
sudo service postgresql start
set environ 'conda deactivate && conda activate lolsite'
tmux new-session -d -s lolsite
tmux send-keys "$environ && python manage.py rundev" C-m
tmux split-window -h
tmux send-keys "$environ && python manage.py celery" C-m
tmux split-window -c "./react/" -v 'yarn start'
tmux a -t lolsite
