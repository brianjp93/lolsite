"""A query debugger from
https://gist.github.com/goutomroy/d61fc8a8445954c71b5585af042e5cf4

"""
from django.db import connection, reset_queries
import time
import functools
from rest_framework.pagination import CursorPagination, PageNumberPagination, LimitOffsetPagination


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


class MultipleFieldLookupMixin:
    """
    Apply this mixin to any view or viewset to get multiple field filtering
    based on a `lookup_fields` attribute, instead of the default single field filtering.
    """
    def get_object(self):
        queryset = self.get_queryset()             # Get the base queryset
        queryset = self.filter_queryset(queryset)  # Apply any filter backends
        filter = {}
        for field in self.lookup_fields:
            if self.kwargs[field]: # Ignore empty fields.
                filter[field] = self.kwargs[field]
        obj = get_object_or_404(queryset, **filter)  # Lookup the object
        self.check_object_permissions(self.request, obj)
        return obj


class LargeResultsSetPagination(PageNumberPagination):
    page_size = 1000
    max_page_size = 1000


class Paginator(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CustomLimitOffsetPagination(LimitOffsetPagination):
    offset_query_param = 'start'
    limit_query_param = 'limit'
    default_limit = 10
    max_limit = 100

    def paginate_queryset(self, queryset, request, view=None):
        """Override to return a queryset."""
        self.limit = self.get_limit(request)
        if self.limit is None:
            return None

        self.count = self.get_count(queryset)
        self.offset = self.get_offset(request)
        self.request = request
        if self.count > self.limit and self.template is not None:
            self.display_page_controls = True

        if self.count == 0 or self.offset > self.count:
            return []
        return queryset[self.offset:self.offset + self.limit]


class CustomCursorPagination(CursorPagination):
    page_size = 20
