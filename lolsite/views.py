"""lolsite/views.py
"""
from django.template.response import TemplateResponse
from django.templatetags.static import static

from player.serializers import FavoriteSerializer, SummonerSerializer
from player.models import Summoner, simplify

from match.models import Match

from data import tasks as dt
from data import constants

from notification import tasks as nt

import re
import json
import logging

logger = logging.getLogger(__name__)


def home(request, path=""):
    """Return basic home address and let react render the rest.
    """
    # some tasks that need to run
    dt.import_missing.delay()
    dt.compute_changes.delay(5)
    nt.delete_old_notifications.delay()

    data = get_base_react_context(request)
    data['meta'] = get_meta_data(request)
    return TemplateResponse(request, "layout/home.html", data)


def get_meta_data(request):
    logo = static('logo-large.png')
    meta = {
        'type': 'website',
        'title': 'Hardstuck.club: A league of legends match history and stats site.',
        'url': 'https://hardstuck.club',
        'image': logo,
        'description': 'Accept your hardstuck-ness.',
    }
    r = re.match(r'/([a-z]+)/(.*)/', request.path)
    if r:
        region, name = r.groups()
        name = simplify(name)
        qs = Summoner.objects.filter(region=region, simple_name=name)
        wins = 0
        kills = 0
        deaths = 0
        assists = 0
        damage = 0
        seconds = 0
        losses = 0
        vision_score = 0
        champions = {}
        if qs:
            summoner = qs[0]
            matches = Match.objects.filter(
                participants__account_id=summoner.account_id,
                game_duration__gt=600,
            ).order_by('-game_creation')[:20]
            for match in matches:
                part = match.participants.get(account_id=summoner.account_id)
                is_win = part.stats.win
                kills += part.stats.kills
                deaths += part.stats.deaths
                assists += part.stats.assists
                damage += part.stats.total_damage_dealt_to_champions
                seconds += match.game_duration
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
            wr = int(wins / total * 100)
            meta['title'] = f'{summoner.name} is {wins} and {losses} in the past {wins + losses} games. {wr}% WR.'
            champions = list(champions.items())
            champions.sort(key=lambda x: -x[1]['count'])
            champions = champions[:3]
            top_played = [f'{x[0]} - {x[1]["count"]}({int(x[1]["wins"] / x[1]["count"] * 100)}% WR)' for x in champions]
            top_played = ', '.join(top_played)
            deaths = deaths if deaths > 0 else 1
            kda = (kills + assists) / deaths
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


def get_base_react_context(request):
    """Get the react context data.
    """
    user = request.user
    user_data = {}
    favorite_data = {}
    default_summoner = {}
    if hasattr(user, 'custom') and user.custom.default_summoner:
        default_summoner = SummonerSerializer(user.custom.default_summoner, many=False).data
    if user.is_authenticated:
        try:
            user_data = {
                "email": request.user.email,
                "is_email_verified": user.custom.is_email_verified,
                "default_summoner": default_summoner,
                "id": user.id,
            }
        except Exception:
            logger.exception("Error while creating user_data dictionary")

        try:
            favorites = request.user.favorite_set.all().order_by("sort_int")
            favorite_data = FavoriteSerializer(favorites, many=True).data
        except Exception:
            logger.exception("Error while retrieving favorites for user.")

    data = {
        "queues": json.dumps(constants.QUEUES),
        "user": json.dumps(user_data),
        "favorites": json.dumps(favorite_data),
    }
    return data
