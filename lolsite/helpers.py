"""A query debugger from
https://gist.github.com/goutomroy/d61fc8a8445954c71b5585af042e5cf4

"""
from django.db import connection, reset_queries
import time
import functools


def query_debugger(func):
    @functools.wraps(func)
    def inner_func(*args, **kwargs):
        reset_queries()
        start_queries = len(connection.queries)
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        end_queries = len(connection.queries)
        count = end_queries - start_queries
        if count:
            queries = connection.queries[-count:]
            for query in queries:
                print(f'[TIME: {query["time"]}] [sql: {query["sql"]}]')
        print(f"Function : {func.__name__}")
        print(f"Number of Queries : {end_queries - start_queries}")
        print(f"Finished in : {(end - start):.2f}s")
        return result
    return inner_func
