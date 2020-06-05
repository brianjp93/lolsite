import joblib

PROS = {
    'doublelift': [
        ('doublelift', 'na'),
    ],
    'bjergsen': [
        ('tsm bjergsen', 'na'),
    ],
    'corejj': [
        ('from iron', 'na'),
    ],
}

CLF = joblib.load('role_predict.svc')
