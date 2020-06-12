# Running the workers

```
> celery worker -A lolsite -l info
```

# running on windows

Celery 4.0+ does not officially support windows but we can work around
it by installing `gevent`

```
> pip install gevent
```

Then we can run a slightly modified version of the earlier command.

```
> celery worker -A lolsite -l info -P gevent
```

