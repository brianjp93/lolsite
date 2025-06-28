import urllib.parse
from typing import Literal
from datetime import timedelta, datetime
from dataclasses import dataclass
from uuid import uuid4
from abc import ABC, abstractmethod

from django.urls import reverse
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
class TokenResponse:
    token_type: str
    access_token: str
    expires_in: int
    refresh_token: str


@dataclass
class Heartrate:
    bpm: float
    source: str
    dt: datetime


class InvalidOauthState(Exception):
    pass


class NoTokenFound(Exception):
    pass


class NoApplication(Exception):
    pass


class ActivityAPIBase(ABC):
    id: Literal["OURA"]
    authorize_url: str
    access_token_url: str
    revoke_url: str
    scopes: list[str]
    base_url: str

    def __init__(self, access_token: None|str=None) -> None:
        super().__init__()
        self.access_token = access_token

    def activate(self, user):
        from activity.models import ApplicationToken
        app = self.application
        token: ApplicationToken|None = app.applicationtoken_set.filter(user=user).order_by("-created_at").first()
        if token:
            if token.expires_at < timezone.now():
                token = self.refresh(token.refresh_token, user)
            self.access_token = token.access_token
        else:
            raise NoTokenFound("Could not find access token.")

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}"
        }

    # AUTHORIZATION ROUTES
    @property
    def application(self):
        from activity.models import Application

        application = Application.objects.filter(code=self.id).first()
        if not application:
            raise NoApplication("No application configured")
        return application

    @cached_property
    def redirect_uri_path(self):
        return reverse(
            "activity:integration-callback", kwargs={"code": self.id.lower()}
        )

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
        if auth_response.state != request.session.get("state", None):
            raise InvalidOauthState()
        exch = self.exchange(auth_response)
        token = self.create_token_from_exchange(exch, request.user)
        return token

    def create_token_from_exchange(self, exch: TokenResponse, user):
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
    def parse_exchange_response(self, response: requests.Response) -> TokenResponse: ...

    def refresh(self, refresh_token, user):
        params = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.application.get_client_id(),
            "client_secret": self.application.get_client_secret(),
        }
        headers = {
            "content-type": "application/x-www-form-urlencoded",
        }
        response = requests.post(self.access_token_url, data=params, headers=headers)
        token = self.parse_refresh_response(response)
        app_token = self.create_token_from_exchange(token, user)
        return app_token

    def parse_refresh_response(self, response: requests.Response) -> TokenResponse:
        token_type = response.json()["token_type"]
        access_token = response.json()["access_token"]
        expires_in = response.json()["expires_in"]
        refresh_token = response.json()["refresh_token"]
        return TokenResponse(
            token_type=token_type,
            access_token=access_token,
            expires_in=int(expires_in),
            refresh_token=refresh_token,
        )

    def revoke(self, access_token):
        params = {
            "access_token": access_token,
        }
        response = requests.get(self.revoke_url, params=params)
        return response.status_code

    # GENERAL ENDPOINTS

    @abstractmethod
    def heartrate(self, start: datetime, end: datetime) -> list[Heartrate]:
        ...

    def update_or_create_heartrate(self, start: datetime, end: datetime, user):
        from activity.models import Heartrate
        hr_list = self.heartrate(start, end)
        to_create = []
        for hr in hr_list:
            to_create.append(
                Heartrate(
                    user=user,
                    bpm=hr.bpm,
                    dt=hr.dt,
                )
            )
        return Heartrate.objects.bulk_create(
            to_create,
            ignore_conflicts=True,
            unique_fields=['user', 'dt'],
        )
