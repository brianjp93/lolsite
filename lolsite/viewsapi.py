from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.contrib.auth.models import User
from django.contrib.auth import login
from django.templatetags.static import static

from match.models import Match, Participant
from data import constants

from player.models import Summoner, simplify

import logging

from player.tasks import handle_multiple_summoners


logger = logging.getLogger(__name__)


META = {
    'type': 'website',
    'title': 'Hardstuck.club: A league of legends match history and stats site.',
    'url': 'https://hardstuck.club',
    'image': static('logo-large.png'),
    'description': 'Accept your hardstuck-ness.',
}

QUEUE_DICT = {x['_id']: x for x in constants.QUEUES}


@api_view(["POST"])
def demo_login(request, format=None):
    """Login to demo user
    """
    data = {}
    status_code = 200

    if request.method == "POST":
        password = request.data["password"]
        demo_user = User.objects.get(username="demo")

        is_password_correct = demo_user.check_password(password)
        if is_password_correct:
            login(request, demo_user)
            data = {"message": "logged in"}
        else:
            data = {"message": "wrong password"}
            status_code = 403

    return Response(data, status=status_code)


def require_login(func):
    """A decorator to return an error if the use is not logged in.
    """

    def wrapper(request, *args, **kwargs):
        if request.user.is_anonymous:
            data = {"message": "User must be logged in.", "status": "NOT_LOGGED_IN"}
            return Response(data, status=403)
        else:
            return func(request, *args, **kwargs)

    return wrapper


def _get_summoner_meta_data(riot_id_name: str, riot_id_tagline: str, region: str):
    meta = META.copy()
    if not riot_id_name or not riot_id_tagline:
        return meta
    riot_id_name = simplify(riot_id_name)
    full_id = f"{riot_id_name}#{riot_id_tagline}"
    qs = Summoner.objects.filter(region=region, simple_riot_id=full_id)
    if len(qs) > 1:
        handle_multiple_summoners(region, simple_riot_id=full_id)
        qs = Summoner.objects.filter(region=region, simple_riot_id=full_id)
    wins = 0
    kills = 0
    deaths = 0
    assists = 0
    damage = 0
    seconds = 0
    losses = 0
    vision_score = 0
    champions: dict[str, dict[str, int]] = {}
    if qs:
        summoner = qs[0]
        matches = Match.objects.filter(
            participants__puuid=summoner.puuid,
            game_duration__gt=600,
        ).order_by('-game_creation')[:20]
        for match in matches:
            part = match.participants.get(puuid=summoner.puuid)
            is_win = part.stats.win
            kills += part.stats.kills
            deaths += part.stats.deaths
            assists += part.stats.assists
            damage += part.stats.total_damage_dealt_to_champions
            seconds += (match.game_duration / 1000)
            vision_score += part.stats.vision_score

            # overall stats
            if is_win:
                wins += 1
            else:
                losses += 1

            # per champ stats
            champ = part.get_champion()
            if champ:
                newstat = champions[champ.name] = champions.get(champ.name, {'wins': 0, 'count': 0})
                newstat['count'] += 1
                if is_win:
                    newstat['wins'] += 1

        total = wins + losses
        total = total or 1
        wr = int(wins / total * 100)
        meta['title'] = f'{summoner.name} is {wins} and {losses} in the past {wins + losses} games. {wr}% WR.'
        champions_list = list(champions.items())
        champions_list.sort(key=lambda x: -x[1]['count'])
        champions_list = champions_list[:3]
        top_played_list = [f'{x[0]} - {x[1]["count"]} ({int(x[1]["wins"] / x[1]["count"] * 100)}% WR)' for x in champions_list]
        top_played = ', '.join(top_played_list)
        deaths = deaths or 1
        kda = (kills + assists) / deaths
        dpm = 0.0
        vspm = 0.0
        if seconds:
            dpm = damage / (seconds / 60)
            vspm = vision_score / (seconds / 60)
        description = [
            f'TOP: {top_played}',
            f'AVG KDA: {kda:.2f}',
            f'DPM: {int(dpm)}',
            f'VISION SCORE/M: {vspm:.2f}',
        ]
        meta['description'] = ' || '.join(description)
        icon = summoner.get_profile_icon()
        if icon:
            meta['image'] = icon.image_url()
    return meta


@api_view(['GET'])
def get_summoner_meta_data(request, region: str, name: str, format=None):
    if '-' in name:
        riot_id_name, riot_id_tagline = name.split('-')
    else:
        return Response(META)
    meta = _get_summoner_meta_data(riot_id_name, riot_id_tagline, region)
    return Response(meta)


def _get_match_meta_data(riot_id_name: str, riot_id_tagline: str, region: str, match_id: str):
    meta = META.copy()
    riot_id_name = simplify(riot_id_name)
    if not riot_id_name or not riot_id_tagline:
        return meta
    full_id = f"{riot_id_name}#{riot_id_tagline}"
    try:
        summoner = Summoner.objects.get(region=region, simple_riot_id=full_id)
    except Summoner.DoesNotExist:
        logger.exception('Could not find summoner.')
        return
    except Summoner.MultipleObjectsReturned:
        summoner = handle_multiple_summoners(region, simple_riot_id=full_id)
    try:
        match = Match.objects.get(_id=match_id)
    except Match.DoesNotExist:
        logger.exception('Could not find match.')
        return
    try:
        part = match.participants.get(puuid=summoner.puuid)
    except Participant.DoesNotExist:
        logger.exception('Could not find participant in match.')
        return
    assert part.stats
    kills = part.stats.kills
    deaths = part.stats.deaths
    deaths = 1 if deaths < 1 else deaths
    assists = part.stats.assists
    minutes = match.game_duration / 60_000
    dpm = 0.0
    vspm = 0.0
    if minutes:
        dpm = part.stats.total_damage_dealt_to_champions / minutes
        vspm = part.stats.vision_score / minutes
    kda = (kills + assists) / deaths
    queue_data: dict|None = QUEUE_DICT.get(match.queue_id, None)
    queue = queue_data['description'].strip('games').strip() if queue_data is not None else '?'
    champion = part.get_champion()
    image = champion.image_url() if champion else meta['image']
    if minutes < 5:
        outcome = 'draw'
    else:
        outcome = 'win' if part.stats.win else 'lose'

    stats_list = [
        f'OUTCOME: {outcome}',
        f'DPM: {int(dpm)}',
        f'VISION/M: {vspm:.2f}',
    ]
    stats = ' ᐃ '.join(stats_list)

    meta['title'] = f'{summoner.name} ({kills} / {deaths} / {assists})[{kda:.2f} KDA] {queue}'
    meta['description'] = stats
    meta['image'] = image
    return meta


@api_view(['GET'])
def get_match_meta_data(request, region, name, match_id, format=None):
    if '-' in name:
        riot_id_name, riot_id_tagline = name.split('-')
    else:
        return Response(META)
    meta = _get_match_meta_data(riot_id_name, riot_id_tagline, region, match_id)
    return Response(meta)
