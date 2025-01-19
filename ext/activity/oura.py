from .api import ActivityAPIBase

class OuraAPI(ActivityAPIBase):
    authorize_url = "https://cloud.ouraring.com/oauth/authorize"
    access_token_url = "https://api.ouraring.com/oauth/token"
    scopes = ["personal", "daily", "heartrate", "workout", "spo2"]
    redirect_uri_path = "/connect/oura/"
