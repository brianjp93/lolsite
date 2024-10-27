from django.db import transaction

from player.models import Summoner
from match.models import Match
from stats.models import SummonerChampion, SummonerChampionAgainst

from lolsite.celery import app


@app.task
def add_match_to_summoner_champion_stats(summoner, match):
    if isinstance(summoner, int):
        summoner = Summoner.objects.get(pk=summoner)
    if isinstance(match, str):
        match = Match.objects.get(_id=match)
    part = (
        match.participants.filter(puuid=summoner.puuid).select_related("stats").first()
    )
    if not part:
        return
    stats = part.stats
    if not stats:
        return
    with transaction.atomic():
        sc, _ = SummonerChampion.objects.select_for_update().get_or_create(
            summoner=summoner,
            major=match.major,
            minor=match.minor,
            champion_key=part.champion_id,
            queue=match.queue_id,
        )
        if not sc:
            return
        if match._id in sc.game_ids:
            # don't update stats if the game has already been seen
            return
        sc.game_ids.append(match._id)
        sc.kills += stats.kills
        sc.deaths += stats.deaths
        sc.assists += stats.assists
        sc.damage_to_champions += stats.total_damage_dealt_to_champions
        sc.damage_to_turrets += stats.damage_dealt_to_turrets
        sc.damage_to_objectives += stats.damage_dealt_to_objectives
        sc.damage_taken += stats.total_damage_taken
        sc.damage_mitigated += stats.damage_self_mitigated
        sc.vision_score += stats.vision_score
        sc.total_seconds += match.seconds
        if stats.win:
            sc.wins += 1
        else:
            sc.losses += 1
        sc.save()
    with transaction.atomic():
        enemy = (
            match.participants.filter(
                team_position=part.team_position,
            )
            .exclude(team_id=part.team_id)
            .first()
        )
        if not enemy:
            return
        sca, _ = SummonerChampionAgainst.objects.select_for_update().get_or_create(
            summoner_champion=sc,
            champion_key=enemy.champion_id,
        )
        if stats.win:
            sca.wins += 1
        else:
            sca.losses += 1
        sca.save()


@app.task
def add_match_to_summoner_champion_stats_all_participants(match):
    if isinstance(match, str):
        match = Match.objects.get(_id=match)
    participants = match.participants.all()
    puuids = [x.puuid for x in participants]
    summoners = Summoner.objects.filter(puuid__in=puuids)
    for summoner in summoners:
        add_match_to_summoner_champion_stats(summoner, match)


@app.task
def add_all_matches_for_summoner_to_stats(summoner):
    if isinstance(summoner, int):
        summoner = Summoner.objects.get(id=summoner)
    seen_games = sum(
        SummonerChampion.objects.filter(summoner=summoner).values_list(
            "game_ids", flat=True
        ),
        start=[],
    )
    new_matches = Match.objects.filter(participants__puuid=summoner.puuid).exclude(
        _id__in=seen_games
    )
    for match in new_matches:
        add_match_to_summoner_champion_stats(summoner, match)
