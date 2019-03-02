from celery import task

from .models import Summoner, NameChange
from .models import simplify
from match.tasks import get_riot_api


# def simplify(name):
#     """Return the lowercase, no space version of a string.

#     Parameters
#     ----------
#     name : str

#     Returns
#     -------
#     str

#     """
#     return ''.join(name.split()).lower()


@task(name='player.tasks.import_summoner')
def import_summoner(region, account_id=None, name=None, summoner_id=None, puuid=None):
    """Import a summoner by one a several identifiers.

    Parameters
    ----------
    region : str
    account_id : ID
    name : str
    summoner_id : ID
    puuid : ID

    Returns
    -------
    None

    """
    api = get_riot_api()
    if api:
        kwargs = {}
        if account_id is not None:
            kwargs['encrypted_account_id'] = account_id
        elif name is not None:
            kwargs['name'] = name
        elif summoner_id is not None:
            kwargs['encrypted_summoner_id'] = summoner_id
        elif puuid is not None:
            kwargs['encrypted_puuid'] = puuid
        r = api.summoner.get(region=region, **kwargs)

        if r.status_code >= 400 and r.status_code < 500:
            raise Exception(f'The request returned a {r.status_code} status.')

        data = r.json()

        model_data = {
            '_id': data['id'],
            'region': region.lower(),
            'account_id': data['accountId'],
            'name': data['name'],
            'profile_icon_id': data['profileIconId'],
            'puuid': data['puuid'],
            'revision_date': data['revisionDate'],
            'summoner_level': data['summonerLevel'],
        }
        query = Summoner.objects.filter(region=region.lower(), account_id=data['accountId'])
        if query.exists():
            summoner_model = query.first()

            for attr in model_data:
                setattr(summoner_model, attr, model_data[attr])
        else:
            summoner_model = Summoner(**model_data)
        summoner_model.save()
