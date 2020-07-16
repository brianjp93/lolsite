import joblib
from django.conf import settings
import pathlib


PROS = {
    "doublelift": [("doublelift", "na"),],
    "bjergsen": [("tsm bjergsen", "na"),],
    "corejj": [("from iron", "na"),],
}

clf_path = pathlib.PurePath(settings.BASE_DIR, "role_predict.svc")
CLF = joblib.load(clf_path)


# verify summonerlink profile icons
VERIFY_WITH_ICON = [0, 21, 10, 9, 25]
