from .api import ActivityAPIBase, AuthorizeResponse, InvalidOauthState, ExchangeResponse


class OuraAPI(ActivityAPIBase):
    id = "OURA"
    authorize_url = "https://cloud.ouraring.com/oauth/authorize"
    access_token_url = "https://api.ouraring.com/oauth/token"
    scopes = ["personal", "daily", "heartrate", "workout", "spo2"]
    redirect_uri_path = "/connect/oura/callback/"

    def parse_authorize_request(self, request) -> AuthorizeResponse:
        code = request.GET["code"]
        scope = request.GET["scope"]
        state = request.GET["state"]
        if state != request.session.get("state", None):
            raise InvalidOauthState()
        return AuthorizeResponse(code=code, scope=scope, state=state)

    def parse_exchange_response(self, response):
        token_type = response.json()["token_type"]
        access_token = response.json()["access_token"]
        expires_in = response.json()["expires_in"]
        refresh_token = response.json()["refresh_token"]
        return ExchangeResponse(
            token_type=token_type,
            access_token=access_token,
            expires_in=int(expires_in),
            refresh_token=refresh_token,
        )
