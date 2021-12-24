#!/bin/bash

source "$PYTHONPATH/activate" && {
  if [[ $EB_IS_COMMAND_LEADER == "true" ]];
  then
    echo "Running migrations and collectstatic";
    python manage.py migrate --noinput;
    python manage.py collectstatic --noinput;
    python manage.py createsu;
  else
    echo "This instance is NOT the leader";
  fi
}
