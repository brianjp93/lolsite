1. run redis-server

2. run the workers

```
> celery worker -A lolsite -l info
```

# running on windows

### redis-server

[redis on Win10](https://redislabs.com/blog/redis-on-windows-10/)

* install a bash shell in windows
* install redis-server
* redis-server start

### celery 4.0+

Celery 4.0+ does not officially support windows but we can work around
it by installing `gevent`

```
> pip install gevent
```

Then we can run a slightly modified version of the earlier command.

```
> celery worker -A lolsite -l info -P gevent
```

