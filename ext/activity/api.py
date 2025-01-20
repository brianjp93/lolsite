import urllib.parse
from typing import Literal
from datetime import timedelta
from dataclasses import dataclass
from uuid import uuid4
from abc import ABC, abstractmethod

import requests

from django.conf import settings
from django.utils.functional import cached_property
from django.utils import timezone


@dataclass
class AuthorizeResponse:
    code: str
    scope: str
    state: str


@dataclass
class ExchangeResponse:
    token_type: str
    access_token: str
    expires_in: int
    refresh_token: str


class InvalidOauthState(Exception):
    pass


class ActivityAPIBase(ABC):
    id: Literal["OURA"]
    authorize_url: str
    access_token_url: str
    scopes: list[str]
    redirect_uri_path: str

    @cached_property
    def application(self):
        from activity.models import Application
        application = Application.objects.filter(code=self.id).first()
        if not application:
            raise Exception("No application configured")
        return application

    @property
    def full_redirect_uri(self):
        return f"{settings.BACKEND_URL}{self.redirect_uri_path}"

    def get_scopes(self):
        return " ".join(self.scopes)

    def get_authorize_url(self, request):
        state = uuid4().hex
        request.session["state"] = state
        params = {
            "response_type": "code",
            "client_id": self.application.get_client_id(),
            "redirect_uri": self.full_redirect_uri,
            "state": state,
            "scope": self.get_scopes(),
        }
        param_string = urllib.parse.urlencode(params)
        return f"{self.authorize_url}?{param_string}"

    def handle_authorize_request(self, request):
        auth_response = self.parse_authorize_request(request)
        exch = self.exchange(auth_response)
        token = self.create_token_from_exchange(exch, request.user)
        return token

    def create_token_from_exchange(self, exch: ExchangeResponse, user):
        from activity.models import ApplicationToken
        expires_at = timezone.now() + timedelta(seconds=exch.expires_in)
        token = ApplicationToken.objects.create(
            user=user,
            application=self.application,
            access_token=exch.access_token,
            expires_at=expires_at,
            refresh_token=exch.refresh_token,
        )
        return token

    @abstractmethod
    def parse_authorize_request(self, request) -> AuthorizeResponse: ...

    def exchange(self, auth_response: AuthorizeResponse):
        params = {
            "grant_type": "authorization_code",
            "code": auth_response.code,
            "redirect_uri": self.full_redirect_uri,
            "client_id": self.application.get_client_id(),
            "client_secret": self.application.get_client_secret(),
        }
        headers = {
            "content-type": "application/x-www-form-urlencoded",
        }
        response = requests.post(self.access_token_url, data=params, headers=headers)
        exch = self.parse_exchange_response(response)
        return exch

    @abstractmethod
    def parse_exchange_response(
        self, response: requests.Response
    ) -> ExchangeResponse: ...

    def refresh(self, refresh_token):
        # TODO: finish refresh logic
        pass
