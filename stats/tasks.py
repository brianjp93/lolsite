from django.db.models import Value
from django.db.models.expressions import CombinedExpression, F

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
    if match.seconds < 180:
        return
    if not part:
        return
    stats = part.stats
    if not stats:
        return

    sc = SummonerChampion(
        summoner=summoner,
        major=match.major,
        minor=match.minor,
        champion_key=part.champion_id,
        queue=match.queue_id,
    )
    SummonerChampion.objects.bulk_create(
        [sc],
        update_conflicts=True,
        unique_fields=["summoner_id", "major", "minor", "champion_key", "queue"],
        update_fields=["champion_key"],
    )
    win_add = loss_add = 0
    if stats.win:
        win_add = 1
    else:
        loss_add = 1
    (
        SummonerChampion.objects.filter(id=sc.pk)
        .exclude(game_ids__contains=[match._id])
        .update(
            game_ids=CombinedExpression(F("game_ids"), "||", Value([match._id])),
            kills=F("kills") + stats.kills,
            deaths=F("deaths") + stats.deaths,
            assists=F("assists") + stats.assists,
            damage_to_champions=F("damage_to_champions")
            + stats.total_damage_dealt_to_champions,
            damage_to_turrets=F("damage_to_turrets") + stats.damage_dealt_to_turrets,
            damage_to_objectives=F("damage_to_objectives")
            + stats.damage_dealt_to_objectives,
            damage_taken=F("damage_taken") + stats.total_damage_taken,
            damage_mitigated=F("damage_mitigated") + stats.damage_self_mitigated,
            vision_score=F("vision_score") + stats.vision_score,
            total_seconds=F("total_seconds") + match.seconds,
            wins=F("wins") + win_add,
            losses=F("losses") + loss_add,
        )
    )

    enemy = (
        match.participants.filter(
            team_position=part.team_position,
        )
        .exclude(team_id=part.team_id)
        .first()
    )
    if not enemy:
        return
    sca = SummonerChampionAgainst(
        summoner_champion=sc,
        champion_key=enemy.champion_id,
    )
    SummonerChampionAgainst.objects.bulk_create(
        [sca],
        update_conflicts=True,
        unique_fields=["summoner_champion_id", "champion_key"],
        update_fields=["champion_key"],
    )
    SummonerChampionAgainst.objects.filter(id=sca.pk).exclude(
        game_ids__contains=[match._id]
    ).update(
        game_ids=CombinedExpression(F("game_ids"), "||", Value([match._id])),
        wins=F("wins") + win_add,
        losses=F("losses") + loss_add,
    )


@app.task
def add_match_to_summoner_champion_stats_all_participants(match):
    """Add to champion stats for all participants of one match."""
    if isinstance(match, str):
        match = Match.objects.get(_id=match)
    puuids = match.participants.all().values_list("puuid", flat=True)
    summoners = Summoner.objects.filter(puuid__in=puuids)
    for summoner in summoners:
        add_match_to_summoner_champion_stats(summoner, match)


@app.task
def add_all_matches_for_summoner_to_stats(summoner, major=None, minor=None):
    if isinstance(summoner, int):
        summoner = Summoner.objects.get(id=summoner)
    elif isinstance(summoner, str):
        summoner = Summoner.objects.get(puuid=summoner)
    sc_qs = SummonerChampion.objects.filter(summoner=summoner)
    if major:
        sc_qs = sc_qs.filter(major=major)
    if minor:
        sc_qs = sc_qs.filter(minor=minor)
    seen_games = sum(sc_qs.values_list("game_ids", flat=True), start=[])
    new_matches = Match.objects.filter(participants__puuid=summoner.puuid).exclude(
        _id__in=seen_games
    )
    if major is not None:
        new_matches = new_matches.filter(major=major)
    if minor is not None:
        new_matches = new_matches.filter(minor=minor)
    for match in new_matches:
        add_match_to_summoner_champion_stats(summoner, match)
