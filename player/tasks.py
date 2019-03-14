from celery import task

from django.utils import timezone

from .models import Summoner, NameChange
from .models import simplify

from .models import RankCheckpoint, RankPosition

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
        # print(data)

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
        query = Summoner.objects.filter(region=region.lower(), _id=data['id'])
        if query.exists():
            summoner_model = query.first()
            # print(summoner_model)

            for attr, val in model_data.items():
                setattr(summoner_model, attr, val)
        else:
            summoner_model = Summoner(**model_data)
        # print(summoner_model.profile_icon_id)
        summoner_model.save()
        return summoner_model.id


def import_positions(summoner_id, threshold_days=None):
    """Get most recent position data for Summoner.

    Parameters
    ----------
    summoner_id : ID
        The internal ID of the Summoner model
    threshold_days : int
        Only update if the last update was more than {threshold_days} days ago

    Returns
    -------
    None

    """
    summoner = Summoner.objects.get(id=summoner_id)

    rankcheckpoint = summoner.get_newest_rank_checkpoint()
    if rankcheckpoint and threshold_days:
        threshold = timezone.now() - timezone.timedelta(days=threshold_days)
        if rankcheckpoint.created_date > threshold:
            # don't run update
            return

    api = get_riot_api()
    region = summoner.region
    r = api.league.positions(summoner._id, region)
    if r.status_code >= 200 and r.status_code < 300:
        positions = r.json()
        create_new = False
        # need to check if anything has changed
        if rankcheckpoint:
            for pos in positions:
                try:
                    attrs = {
                        'league_points': pos['leaguePoints'],
                        'wins': pos['wins'],
                        'losses': pos['losses'],
                        'queue_type': pos['queueType'],
                        'rank': pos['rank'],
                        'tier': pos['tier'],
                        'position': pos['position'],
                        'series_progress': pos.get('miniSeries', {}).get('progress', None),
                    }
                    query = rankcheckpoint.positions.get(**attrs)
                    print('Nothing has changed, not creating a new checkpoint')
                except:
                    print('Change detected.')
                    create_new = True
        else:
            create_new = True

        if create_new:
            rankcheckpoint = RankCheckpoint(summoner=summoner)
            rankcheckpoint.save()
            for pos in positions:
                attrs = {
                    'checkpoint': rankcheckpoint,
                    'league_points': pos['leaguePoints'],
                    'wins': pos['wins'],
                    'losses': pos['losses'],
                    'queue_type': pos['queueType'],
                    'rank': pos['rank'],
                    'tier': pos['tier'],
                    'position': pos['position'],
                    'hot_streak': pos['hotStreak'],
                    'fresh_blood': pos['freshBlood'],
                    'inactive': pos['inactive'],
                    'veteran': pos['veteran'],
                    'series_progress': pos.get('miniSeries', {}).get('progress', None),
                }
                rankposition = RankPosition(**attrs)
                rankposition.save()