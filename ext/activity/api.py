from uuid import uuid4
from abc import ABC
import requests
from django.conf import settings


class ActivityAPIBase(ABC):
    authorize_url: str
    access_token_url: str
    scopes: list[str]
    redirect_uri_path: str

    def __init__(self, client_id: str):
        self.client_id = client_id

    @property
    def redirect_uri(self):
        return f"{settings.BACKEND_URL}{self.redirect_uri}"

    def get_scopes(self):
        return " ".join(self.scopes)

    def authorize(self, request):
        state = uuid4().hex
        request.session["state"] = state
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": self.get_scopes(),
        }
        requests.get(self.authorize_url, params=params)
