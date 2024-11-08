from django.db.models.functions import Cast, Greatest
from django.shortcuts import render
from django.db.models import F, Sum
from django.db import models

from stats.models import SummonerChampion
from stats.tasks import add_all_matches_for_summoner_to_stats

from data.models import Rito, Champion


def champion_stats_context(puuid, major=None, minor=None, queue=420):
    versions = []
    last_major = None
    for version in Rito.objects.first().minor_version_list:
        if version["major"] != last_major:
            last_major = version["major"]
            versions.append(
                {
                    "version": f"{version["major"]}.x",
                    "major": version["major"],
                    "minor": None,
                    "patch": None,
                }
            )
        versions.append(version)
    if not major:
        major = int(versions[1]["major"])
        minor = int(versions[1]["minor"])

    add_all_matches_for_summoner_to_stats(puuid, major=major, minor=minor)

    qs = SummonerChampion.objects.filter(summoner__puuid=puuid)
    if major is not None:
        qs = qs.filter(major=major)
    if minor is not None:
        qs = qs.filter(minor=minor)
    if queue is not None:
        qs = qs.filter(queue=queue)

    qs = qs.values("summoner", "champion_key").annotate(
        kills=Sum("kills"),
        deaths=Sum("deaths"),
        assists=Sum("assists"),
        damage_to_champions=Sum("damage_to_champions"),
        damage_to_objectives=Sum("damage_to_objectives"),
        damage_to_turrets=Sum("damage_to_turrets"),
        damage_taken=Sum("damage_taken"),
        damage_mitigated=Sum("damage_mitigated"),
        vision_score=Sum("vision_score"),
        total_seconds=Sum("total_seconds"),
        wins=Sum("wins"),
        losses=Sum("losses"),
    ).with_computed_stats()

    qs = qs.annotate(
        game_count=F("wins") + F("losses"),
    ).order_by("-game_count")

    keys = [x["champion_key"] for x in qs]
    champions = {
        x.key: x
        for x in Champion.objects.filter(key__in=keys).order_by("-key").distinct("key")
    }
    for cs in qs:
        cs["champion"] = champions.get(int(cs["champion_key"]), None)

    return {
        "championstats": qs,
        "major": major,
        "minor": minor,
        "queue": queue,
        "puuid": puuid,
        "versions": versions[:10],
    }


def champion_stats(request, puuid, major=None, minor=None, queue=420):
    context = champion_stats_context(puuid, major, minor, queue)
    return render(request, "stats/_champions.html", context)
