"""lolsite/tasks.py
"""
from data.models import Rito
from lol.riot import Riot as RiotAPI


def get_riot_api():
    """Get an instance of the RiotAPI wrapper.

    Uses the token stored in the data.Rito model

    Returns
    -------
    RiotAPI or None

    """
    api = None
    query = Rito.objects.all()
    if query.exists():
        rito = query.first()
        if rito.token:
            api = RiotAPI(rito.token)
    return api

