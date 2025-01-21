from pydantic import BaseModel, ValidationError
import requests
from .api import ActivityAPIBase, AuthorizeResponse, Heartrate, TokenResponse
from django.utils.dateparse import parse_datetime
import logging


logger = logging.getLogger(__name__)


class OuraHeartrate(BaseModel):
    bpm: float
    source: str
    timestamp: str


class OuraHeartrateResponse(BaseModel):
    data: list[OuraHeartrate]
    next_token: str | None


class OuraAPI(ActivityAPIBase):
    id = "OURA"
    authorize_url = "https://cloud.ouraring.com/oauth/authorize"
    access_token_url = "https://api.ouraring.com/oauth/token"
    revoke_url = "https://api.ouraring.com/oauth/revoke"
    scopes = ["personal", "daily", "heartrate", "workout", "spo2"]
    base_url = "https://api.ouraring.com"

    def parse_authorize_request(self, request) -> AuthorizeResponse:
        code = request.GET["code"]
        scope = request.GET["scope"]
        state = request.GET["state"]
        return AuthorizeResponse(code=code, scope=scope, state=state)

    def parse_exchange_response(self, response):
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

    def heartrate(self, start, end):
        url = f"{self.base_url}/v2/usercollection/heartrate"
        params = {
            "start_datetime": start.isoformat(),
            "end_datetime": end.isoformat(),
        }
        hr_list = []
        while params:
            response = requests.get(url, params=params, headers=self.headers)
            try:
                data = OuraHeartrateResponse.model_validate_json(response.content)
            except ValidationError:
                logger.error(f"Could not parse oura heartrate response. {response.status_code=} {response.content=}")
                return []
            if data.next_token:
                params = {"next_token": data.next_token}
            else:
                params = None
            for hr in data.data:
                dt = parse_datetime(hr.timestamp)
                assert dt, f"No timestamp? {hr.timestamp=}"
                hr_list.append(Heartrate(
                    bpm=hr.bpm,
                    source=hr.source,
                    dt=dt,
                ))
        return hr_list
