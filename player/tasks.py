from lolsite.celery import app

from django.utils import timezone
from django.contrib.auth.models import User

from player.parsers.account_parsers import AccountParser

from .models import NameChange, Summoner
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
            pro = query[:1].get()
        for ign, region in constants.PROS[alias]:
            ign = simplify(ign)
            query = Summoner.objects.filter(region=region, simple_name=ign)
            if not query.exists():
                summoner_id = import_summoner(region, name=ign)
                summoner = Summoner.objects.get(id=summoner_id)
            else:
                summoner = query[:1].get()
            if not summoner.pro == pro:
                summoner.pro = pro
                summoner.save()


@app.task(name="player.tasks.import_summoner")
def import_summoner(
    region=None,
    name=None,
    puuid=None,
    riot_id_name=None,
    riot_id_tagline=None,
):
    api = get_riot_api()
    kwargs = {}
    game_name = ""
    tagline = ""
    if riot_id_name and riot_id_tagline and region:
        r = api.account.by_riot_id(riot_id_name, riot_id_tagline)
        if 400 <= r.status_code < 500:
            logger.warning("Summoner not found.")
            return None
        acc = AccountParser.model_validate_json(r.content)
        game_name = acc.gameName
        tagline = acc.tagLine
        r = api.summoner.get(encrypted_puuid=acc.puuid, region=region)
    elif region:
        if name is not None:
            kwargs["name"] = name
        elif puuid is not None:
            kwargs["encrypted_puuid"] = puuid
            r = api.account.by_puuid(puuid, region=region)
            acc = AccountParser.model_validate_json(r.content)
            game_name = acc.gameName
            tagline = acc.tagLine
        r = api.summoner.get(region=region, **kwargs)
    else:
        raise Exception("Improper function call.")

    if r.status_code >= 400 and r.status_code < 500:
        logger.warning("Summoner not found.")
        return None

    data = r.json()
    name = data.get('name', '')
    model_data = {
        "name": data.get('name', '').strip(),
        "simple_name": simplify(name),
        "profile_icon_id": data["profileIconId"],
        "revision_date": data["revisionDate"],
        "summoner_level": data["summonerLevel"],
        'region': region.lower(),
    }
    if game_name:
        model_data['riot_id_name'] = game_name
    if tagline:
        model_data['riot_id_tagline'] = tagline
    if old_summoner := Summoner.objects.filter(puuid=data['puuid']).first():
        if game_name and tagline:
            handle_name_change(old_summoner, game_name, tagline)
    summoner, _ = Summoner.objects.update_or_create(
        puuid=data['puuid'],
        defaults=model_data,
    )
    return summoner.id


def handle_name_change(summoner: Summoner, riot_id: str, riot_tagline: str):
    """Add a new NameChange, if the name is different from what is currently
    stored in the Summoner model.

    """
    simple_riot_id = simplify(f"{riot_id}#{riot_tagline}")
    if not simple_riot_id:
        return
    if summoner.simple_riot_id:
        old_name = summoner.simple_riot_id
        og = f"{summoner.riot_id_name}#{summoner.riot_id_tagline}"
    else:
        old_name = summoner.simple_name
        og = summoner.name
    if simple_riot_id != old_name:
        return NameChange.objects.create(
            summoner=summoner,
            old_name=og,
        )


@app.task(name='player.tasks.import_positions')
def import_positions(summoner: Summoner|int, threshold_days=None):
    if not isinstance(summoner, Summoner):
        summoner = Summoner.objects.get(id=summoner)

    logger.info(f'Trying to import positions for summoner: {summoner}')

    rankcheckpoint = summoner.get_newest_rank_checkpoint()
    if rankcheckpoint and threshold_days:
        threshold = timezone.now() - timezone.timedelta(days=threshold_days)
        if rankcheckpoint.created_date > threshold:
            # don't run update
            return

    api = get_riot_api()
    region = summoner.region
    r = api.league.entries_by_puuid(summoner.puuid, region)
    logger.info(f'api.league.entries response: {r}')
    if r.status_code >= 200 and r.status_code < 300:
        positions = r.json()
        create_new = False
        # need to check if anything has changed
        queue_types = {x['queueType'] for x in positions}
        if rankcheckpoint:
            current_queue_types = {x.queue_type for x in rankcheckpoint.positions.all()}
            for pos in positions:
                try:
                    attrs = {
                        "league_points": pos["leaguePoints"],
                        "wins": pos["wins"],
                        "losses": pos["losses"],
                        "queue_type": pos["queueType"],
                        "rank": pos.get("rank", ""),
                        "tier": pos.get('tier', ''),
                        "series_progress": pos.get("miniSeries", {}).get(
                            "progress", None
                        ),
                    }
                    rankcheckpoint.positions.get(**attrs)
                except RankPosition.DoesNotExist:
                    create_new = True
            if len(current_queue_types - queue_types):
                logger.info(f"We have {len(current_queue_types)} rank positions, but riot only has {len(queue_types)}. We will remove some of ours.")
                create_new = True
        else:
            create_new = True

        if create_new:
            rankcheckpoint = RankCheckpoint(summoner=summoner)
            rankcheckpoint.save()
            for pos in positions:
                if 'rank' not in pos:
                    logger.info(f'Position Data: {pos}')
                    logger.info(f'Rank information not available.  Skipping for {summoner}.')
                    continue
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
                logger.info(f'Saving new rank position for {summoner}')
                rankposition = RankPosition(**attrs)
                rankposition.save()
        else:
            logger.info("No ranked changes.")


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
        email_verification = query[:1].get()
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


def handle_multiple_summoners(region: str, **kwargs):
    for summoner in Summoner.objects.filter(region=region, **kwargs):
        import_summoner(region, puuid=summoner.puuid)
    return Summoner.objects.filter(region=region, **kwargs)[:1].get()
