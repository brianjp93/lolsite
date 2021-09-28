from celery import task

from django.db import connection
from django.utils import timezone
from django.contrib.auth.models import User

from .models import Summoner
from .models import simplify
from .models import RankCheckpoint, RankPosition
from .models import Custom, EmailVerification
from .models import Pro

from . import constants

from lolsite.tasks import get_riot_api
import logging


logger = logging.getLogger(__name__)


def import_pros(overwrite=False):
    # TODO import pros
    if overwrite:
        for pro in Pro.objects.all():
            pro.delete()
    for alias in constants.PROS:
        query = Pro.objects.filter(ign=alias)
        if not query.exists():
            pro = Pro(ign=alias)
            pro.save()
        else:
            pro = query.first()
        for ign, region in constants.PROS[alias]:
            ign = simplify(ign)
            query = Summoner.objects.filter(region=region, simple_name=ign)
            if not query.exists():
                summoner_id = import_summoner(region, name=ign)
                summoner = Summoner.objects.get(id=summoner_id)
            else:
                summoner = query.first()
            if not summoner.pro == pro:
                summoner.pro = pro
                summoner.save()


@task(name="player.tasks.import_summoner")
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
    summoner_id

    """
    api = get_riot_api()
    if api:
        kwargs = {}
        if account_id is not None:
            kwargs["encrypted_account_id"] = account_id
        elif name is not None:
            kwargs["name"] = name
        elif summoner_id is not None:
            kwargs["encrypted_summoner_id"] = summoner_id
        elif puuid is not None:
            kwargs["encrypted_puuid"] = puuid
        r = api.summoner.get(region=region, **kwargs)

        if r.status_code >= 400 and r.status_code < 500:
            raise Exception(f"The request returned a {r.status_code} status.")

        data = r.json()

        model_data = {
            "_id": data["id"],
            "region": region.lower(),
            "account_id": data["accountId"],
            "name": data["name"],
            "profile_icon_id": data["profileIconId"],
            "puuid": data["puuid"],
            "revision_date": data["revisionDate"],
            "summoner_level": data["summonerLevel"],
        }
        query = Summoner.objects.filter(region=region.lower(), _id=data["id"])
        if query.exists():
            summoner_model = query.first()

            for attr, val in model_data.items():
                setattr(summoner_model, attr, val)
        else:
            summoner_model = Summoner(**model_data)
        summoner_model.save()
        return summoner_model.id


def import_positions(summoner, threshold_days=None, close=False):
    """Get most recent position data for Summoner.

    Parameters
    ----------
    summoner : Summoner or Summoner.id
        The internal ID of the Summoner model
    threshold_days : int
        Only update if the last update was more than {threshold_days} days ago

    Returns
    -------
    None

    """
    if not isinstance(summoner, Summoner):
        summoner = Summoner.objects.get(id=summoner)

    rankcheckpoint = summoner.get_newest_rank_checkpoint()
    if rankcheckpoint and threshold_days:
        threshold = timezone.now() - timezone.timedelta(days=threshold_days)
        if rankcheckpoint.created_date > threshold:
            # don't run update
            return

    api = get_riot_api()
    region = summoner.region
    r = api.league.entries(summoner._id, region)
    if r.status_code >= 200 and r.status_code < 300:
        positions = r.json()
        create_new = False
        # need to check if anything has changed
        if rankcheckpoint:
            for pos in positions:
                try:
                    attrs = {
                        "league_points": pos["leaguePoints"],
                        "wins": pos["wins"],
                        "losses": pos["losses"],
                        "queue_type": pos["queueType"],
                        "rank": pos["rank"],
                        "tier": pos["tier"],
                        "series_progress": pos.get("miniSeries", {}).get(
                            "progress", None
                        ),
                    }
                    rankcheckpoint.positions.get(**attrs)
                    logger.info("Nothing has changed, not creating a new checkpoint")
                except:
                    logger.info("Change detected.")
                    create_new = True
        else:
            create_new = True

        if create_new:
            rankcheckpoint = RankCheckpoint(summoner=summoner)
            rankcheckpoint.save()
            for pos in positions:
                attrs = {
                    "checkpoint": rankcheckpoint,
                    "league_points": pos["leaguePoints"],
                    "wins": pos["wins"],
                    "losses": pos["losses"],
                    "queue_type": pos["queueType"],
                    "rank": pos["rank"],
                    "tier": pos["tier"],
                    "hot_streak": pos["hotStreak"],
                    "fresh_blood": pos["freshBlood"],
                    "inactive": pos["inactive"],
                    "veteran": pos["veteran"],
                    "series_progress": pos.get("miniSeries", {}).get("progress", None),
                }
                rankposition = RankPosition(**attrs)
                rankposition.save()
    connection.close()


def simplify_email(email):
    return email.strip().lower()


def is_new_email_valid(email: str, password: str) -> bool:
    simplified_email = simplify_email(email)
    query = User.objects.filter(email__iexact=simplified_email)
    valid = True
    if query.exists():
        valid = False

    if len(password) <= 6:
        valid = False
    return valid


def create_account(email, password):
    """Create an account.

    Parameters
    ----------
    email : str
    password : str

    Returns
    -------
    User

    """
    is_valid = is_new_email_valid(email, password)
    user = False

    if is_valid:
        user = User.objects.create_user(email, email, password)
        custom = Custom(user=user)
        custom.save()
        verification = EmailVerification(user=user)
        verification.save()
    return user


def verify_user_email(code, age_hours=1):
    """Verify a User's email.

    * Sets is_email_verified to True, then deletes the associated
        EmailVerification model.

    Parameters
    ----------
    code : str

    Returns
    -------
    bool

    """
    verified = False
    thresh = timezone.now() - timezone.timedelta(hours=age_hours)
    query = EmailVerification.objects.filter(code=code, created_date__gte=thresh)
    if query.exists():
        email_verification = query.first()
        custom = email_verification.user.custom
        custom.is_email_verified = True
        custom.save()
        email_verification.delete()
        verified = True

    return verified


def remove_old_email_verification(age_hours=1):
    """Delete all EmailVerification models older than `age_hours`

    Parameters
    ----------
    age_hours : int

    Returns
    -------
    None

    """
    thresh = timezone.now() - timezone.timedelta(hours=age_hours)
    query = EmailVerification.objects.filter(created_date__lt=thresh)
    query.delete()
