"""A query debugger from
https://gist.github.com/goutomroy/d61fc8a8445954c71b5585af042e5cf4

"""
import functools
import time

from django_htmx.middleware import HtmxDetails
from rest_framework.pagination import CursorPagination, PageNumberPagination, LimitOffsetPagination

from django.db import connection, reset_queries, models
from django.http import HttpRequest
from django.contrib.auth.models import AnonymousUser, User

from player.models import Custom, EmailVerification, Favorite, Follow, SummonerLink


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

    def paginate_queryset(self, queryset, request, view=None):  # type: ignore
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


class UserType(User):
    follow_set: models.QuerySet[Follow]
    favorite_set: models.QuerySet[Favorite]
    emailverification_set: models.QuerySet[EmailVerification]
    custom: Custom
    summonerlinks: models.QuerySet[SummonerLink]

    class Meta:
        abstract = True


class HtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails
    user: UserType | AnonymousUser  # type: ignore


class AuthenticatedHtmxHttpRequest(HttpRequest):
    htmx: HtmxDetails
    user: UserType  # type: ignore


class HtmxMixin:
    request: HtmxHttpRequest
