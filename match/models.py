from datetime import datetime
import zoneinfo
import logging
from typing import Iterable, List, TypedDict, Union
from functools import cached_property

from pydantic import BaseModel
from pydantic.fields import computed_field

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import Func, QuerySet
from django.contrib.postgres.fields import ArrayField
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from lolsite.helpers import query_debugger
from core.models import VersionedModel
from data.models import ReforgedTree, ReforgedRune
from data.models import Item
from data.models import SummonerSpell, Champion
from data import constants
from match.managers import MatchManager
from player.models import simplify, Summoner, Comment


logger = logging.getLogger(__name__)


def sort_positions(positions):
    """Uses tier_sort, rank_sort and lp_sort to sort positions by descending rank."""
    return sorted(positions, key=lambda x: (tier_sort(x), rank_sort(x), lp_sort(x)))


def tier_sort(position):
    """Returns index of a position's tier.

    Parameters
    ----------
    position : dict

    Returns
    -------
    int

    """
    tier_order = (
        "challenger",
        "grandmaster",
        "master",
        "diamond",
        "platinum",
        "gold",
        "silver",
        "bronze",
        "iron",
    )
    try:
        index = tier_order.index(position["tier"].lower())
    except:
        index = 100
    return index


def rank_sort(position):
    """Returns index of position's rank.

    Parameters
    ----------
    position : dict

    Returns
    -------
    int

    """
    division_order = ("i", "ii", "iii", "iv", "v")
    try:
        index = division_order.index(position["rank"].lower())
    except:
        index = 100
    return index


def lp_sort(position):
    """Returns negative LP.

    Parameters
    ----------
    position : dict

    Returns
    -------
    int

    """
    lp = 0
    try:
        lp = -position.get("league_points", position["leaguePoints"])
    except:
        pass
    return lp


class MatchSummary(models.Model):
    class Status(models.TextChoices):
        RETRIEVING = "r", _("Retrieving")
        COMPLETE = "c", _("Complete")
        FAILED = "f", _("Failed")

    match = models.OneToOneField['Match']("Match", on_delete=models.CASCADE)
    content = models.TextField(default="")
    status = models.CharField(
        choices=Status.choices, max_length=1, default=Status.RETRIEVING
    )
    created_at = models.DateTimeField(default=timezone.now)


def set_focus_participants(object_list: list, puuid: str):
    for obj in object_list:
        obj.focus = None
        for part in obj.participants.all():
            if part.puuid == puuid:
                obj.focus = part
                break


class BanWithChampion(TypedDict):
    champion: Champion | None


def set_related_match_objects(object_list: Iterable['Match'], timeline: 'AdvancedTimeline | None' = None):
    qs = Match.objects.filter(id__in=[x.id for x in object_list])
    qs = qs.prefetch_related("participants", "participants__stats")
    related = qs.get_related()
    for obj in object_list:
        for team in obj.teams.all():
            for ban in team.bans.all():
                ban.champion = related['champions'].get(ban.champion_id, None)  # type: ignore
        for part in obj.participants.all():
            part.items = []  # type: ignore
            keys = [
                "item_0",
                "item_1",
                "item_2",
                "item_3",
                "item_4",
                "item_5",
                "item_6",
            ]
            for key in keys:
                setattr(part, key, None)

            for key in keys:
                if item_id := getattr(part.stats, key):
                    item = related["items"].get(item_id)
                    setattr(part, key, item)
                    part.items.append(item)  # type: ignore
                else:
                    part.items.append(None)  # type: ignore
            if part.items:  # type: ignore
                part.items.pop()  # type: ignore

            # champion
            part.champion = related["champions"].get(part.champion_id, None)  # type: ignore

            part.spell_1 = related['spells'].get(part.summoner_1_id)  # type: ignore
            part.spell_2 = related['spells'].get(part.summoner_2_id)  # type: ignore
            part.rune = related['runes'].get(part.stats.perk_0)  # type: ignore
            part.substyle = related['substyles'].get(part.stats.perk_sub_style)  # type: ignore
            if timeline:
                part.bounty = timeline.bounties.get(part._id, None)  # type: ignore


class ToTimestamp(Func):
    function = 'to_timestamp'
    template = "%(function)s(%(expressions)s)"
    output_field = models.DateTimeField()  # type: ignore


class Match(VersionedModel):
    _id = models.CharField(unique=True, db_index=True, max_length=32)
    game_creation = models.BigIntegerField(db_index=True)
    game_creation_dt = models.GeneratedField(
        expression=ToTimestamp(models.F("game_creation") / 1000),
        output_field=models.DateTimeField(),
        db_index=True,
        db_persist=True,
    )
    game_duration = models.BigIntegerField()
    game_mode = models.CharField(max_length=32, default="", blank=True)
    game_type = models.CharField(max_length=32, default="", blank=True)
    map_id = models.IntegerField()
    platform_id = models.CharField(max_length=16, default="", blank=True)
    queue_id = models.IntegerField(db_index=True)
    season_id = models.IntegerField(null=True)
    game_version = models.CharField(max_length=32, default="", blank=True)
    build = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    end_of_game_result = models.CharField(max_length=32, default=None, null=True, blank=True)

    objects: MatchManager = MatchManager()  # type: ignore

    id: int | None
    pk: int | None
    advancedtimeline: Union["AdvancedTimeline", None]
    participants: QuerySet["Participant"]
    comments: QuerySet[Comment]
    teams: QuerySet["Team"]

    matchsummary: MatchSummary | None

    @cached_property
    def slug(self):
        return self._id

    def __str__(self):
        return f"Match(_id={self._id}, queue_id={self.queue_id}, game_version={self.game_version})"

    @cached_property
    def external_id(self):
        return self._id

    @cached_property
    def result(self):
        match self.end_of_game_result:
            case 'Abort_Unexpected':
                return 'abort_unexpected'
            case 'Abort_AntiCheatExit':
                return 'abort_anticheat'
            case 'Abort_TooFewPlayers':
                return 'abort_too_few_players'
        return 'normal'

    def get_absolute_url(self, pname: str | None = None):
        """Get url of match."""
        if pname is None:
            pname = ""
            if part := self.participants.all().first():
                pname = part.summoner_name_simplified
            else:
                logger.exception("problem while finding participant")
        else:
            pname = simplify(pname)
        if pname:
            region = self.platform_id.lower()
            if region[-1].isdigit():
                region = region[:-1]
            url = f"/{region}/{pname}/match/{self._id}"
        else:
            url = ""
        return url

    @cached_property
    def region(self):
        region = self.platform_id.lower()
        if region[-1].isdigit():
            region = region[:-1]
        match region:
            case "oc":
                region = "oce"
        return region

    @cached_property
    def seconds(self):
        return self.game_duration / 1000

    @cached_property
    def minutes(self):
        return self.seconds / 60

    @cached_property
    def formatted_game_duration(self):
        minutes, seconds = divmod(self.seconds, 60)
        minutes = int(minutes)
        seconds = int(seconds)
        return f"{minutes}:{seconds:02}"

    @cached_property
    def sorted_participants(self):
        from match.tasks import get_sorted_participants

        return get_sorted_participants(self, participants=self.participants.all())

    def team100(self):
        return [x for x in self.sorted_participants if x.team_id == 100]

    def team100_win(self):
        for team in self.teams.all():
            if team._id == 100:
                return team.win
        return False

    def team200_win(self):
        for team in self.teams.all():
            if team._id == 200:
                return team.win
        return False

    def team200(self):
        return [x for x in self.sorted_participants if x.team_id != 100]

    def get_creation(self):
        """Get creation as datetime"""
        utc = zoneinfo.ZoneInfo("UTC")
        dt = datetime.fromtimestamp(self.game_creation // 1000, tz=utc)
        return dt

    def get_comment_count(self):
        return self.comments.all().count()

    def is_summoner_in_game(self, summoners: List[Summoner]):
        """Find if a summoner is in the game."""
        try:
            return self.participants.filter(puuid__in=[x.puuid for x in summoners])[
                :1
            ].get()
        except ObjectDoesNotExist:
            return None

    def queue_name(self):
        return constants.QUEUE_DICT.get(self.queue_id, {}).get('description', self.queue_id)


class Participant(models.Model):
    id: int | None
    match = models.ForeignKey["Match"](
        "Match", on_delete=models.CASCADE, related_name="participants"
    )
    _id = models.IntegerField()  # participantID

    puuid = models.CharField(max_length=128, default=None, db_index=True, null=True)
    summoner_name = models.CharField(max_length=256, default="", blank=True)
    summoner_name_simplified = models.CharField(max_length=128, default="", blank=True)

    champion_id = models.IntegerField()
    champ_experience = models.IntegerField(default=None, null=True, blank=True)
    summoner_1_id = models.IntegerField()
    summoner_1_casts = models.IntegerField(default=0)
    summoner_2_id = models.IntegerField()
    summoner_2_casts = models.IntegerField(default=0)
    team_id = models.IntegerField()
    riot_id_name = models.CharField(default="", max_length=64)
    riot_id_tagline = models.CharField(default="", max_length=8)

    placement = models.IntegerField(default=0)
    subteam_placement = models.IntegerField(default=0)

    # from timeline
    lane = models.CharField(max_length=64, default="", blank=True)
    role = models.CharField(max_length=64, default="", blank=True)
    individual_position = models.CharField(
        max_length=16, default=None, null=True, blank=True
    )
    team_position = models.CharField(max_length=16, null=True, default=None, blank=True)

    # custom added fields.
    rank = models.CharField(max_length=32, default="", blank=True, null=True)
    tier = models.CharField(max_length=32, default="", blank=True, null=True)
    # label for ML training
    # 0=top, 1=jg, 2=mid, 3=adc, 4=sup
    role_label = models.IntegerField(default=None, null=True)

    stats: Union["Stats", None]

    class Meta:
        unique_together = ("match", "_id")

    def get_id(self):
        return self._id

    @cached_property
    def simple_riot_id(self):
        return simplify(f"{self.riot_id_name}#{self.riot_id_tagline}")

    def get_absolute_url(self):
        return reverse("player:summoner-puuid", kwargs={"puuid": self.puuid})

    def save(self, *args, **kwargs):
        self.summoner_name_simplified = simplify(self.summoner_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Participant(summoner_name={self.summoner_name}, match={self.match._id})"
        )

    def get_name(self):
        if self.riot_id_name and self.riot_id_tagline:
            name = f"{self.riot_id_name}#{self.riot_id_tagline}"
        else:
            name = self.summoner_name
        return " ".join(name.split()).strip()

    def get_champion(self):
        return (
            Champion.objects.filter(key=self.champion_id)
            .order_by("-major", "-minor")
            .first()
        )

    def spell_1_image_url(self):
        url = ""
        query = SummonerSpell.objects.filter(key=self.summoner_1_id)
        try:
            spell = query[:1].get()
            url = spell.image_url()
        except SummonerSpell.DoesNotExist:
            pass
        return url

    def spell_2_image_url(self):
        url = ""
        query = SummonerSpell.objects.filter(key=self.summoner_2_id)
        try:
            spell = query[:1].get()
            url = spell.image_url()
        except SummonerSpell.DoesNotExist:
            pass
        return url

    def result(self):
        if stats := getattr(self, 'stats', None):
            if stats.win:
                return 'win'
            elif self.match.game_duration / 1000 / 60 < 5:
                return 'remake'
        return 'loss'

    def get_stat(self, stat, default=0):
        if stats := getattr(self, 'stats'):
            return getattr(stats, stat, default)
        return default

    @cached_property
    def match_minutes(self):
        return self.match.minutes or 1

    @cached_property
    def dpm(self):
        return self.get_stat('total_damage_dealt_to_champions') / self.match_minutes

    @cached_property
    def vspm(self):
        return self.get_stat('vision_score') / self.match_minutes

    @cached_property
    def kda(self):
        return (self.get_stat("kills") + self.get_stat("assists")) / (self.get_stat("deaths") or 1)

    @cached_property
    def tdpm(self):
        return self.get_stat('damage_dealt_to_turrets') / self.match_minutes

    @cached_property
    def damage_share(self):
        """Get the participant's damage share percentage"""
        team_participants = self.match.team100() if self.team_id == 100 else self.match.team200()
        team_damage = sum(p.get_stat('total_damage_dealt_to_champions') for p in team_participants)
        if team_damage > 0:
            return (self.get_stat('total_damage_dealt_to_champions') / team_damage) * 100
        return 0

    @cached_property
    def normalized_damage_share(self):
        """Get normalized damage share where highest damage dealer is 100%"""
        team_participants = self.match.team100() if self.team_id == 100 else self.match.team200()
        # Find max damage in team
        max_damage = max(p.get_stat('total_damage_dealt_to_champions') for p in team_participants)
        if max_damage > 0:
            return (self.get_stat('total_damage_dealt_to_champions') / max_damage) * 100
        return 0

    @cached_property
    def kill_participation(self):
        """Get the participant's kill participation percentage"""
        team_participants = self.match.team100() if self.team_id == 100 else self.match.team200()
        team_kills = sum(p.get_stat('kills') for p in team_participants)
        if team_kills > 0:
            return ((self.get_stat('kills') + self.get_stat('assists')) / team_kills) * 100
        return 0


class Stats(models.Model):
    participant = models.OneToOneField("Participant", on_delete=models.CASCADE)

    assists = models.IntegerField(default=0, blank=True)
    champ_level = models.IntegerField(default=0, null=True, blank=True)
    damage_dealt_to_objectives = models.IntegerField(default=0, blank=True)
    damage_dealt_to_turrets = models.IntegerField(default=0, blank=True)
    damage_self_mitigated = models.IntegerField(default=0, blank=True)
    deaths = models.IntegerField(default=0, blank=True)
    double_kills = models.IntegerField(default=0, blank=True)
    first_blood_assist = models.BooleanField(default=False, blank=True)
    first_blood_kill = models.BooleanField(default=False, blank=True)
    first_tower_assist = models.BooleanField(default=False, blank=True)
    first_tower_kill = models.BooleanField(default=False, blank=True)
    gold_earned = models.IntegerField(default=0, blank=True)
    gold_spent = models.IntegerField(default=0, blank=True)
    inhibitor_kills = models.IntegerField(default=0, blank=True)
    item_0 = models.IntegerField(default=0, blank=True)
    item_1 = models.IntegerField(default=0, blank=True)
    item_2 = models.IntegerField(default=0, blank=True)
    item_3 = models.IntegerField(default=0, blank=True)
    item_4 = models.IntegerField(default=0, blank=True)
    item_5 = models.IntegerField(default=0, blank=True)
    item_6 = models.IntegerField(default=0, blank=True)
    kills = models.IntegerField(default=0, blank=True)
    largest_multi_kill = models.IntegerField(default=0, blank=True)
    magic_damage_dealt = models.IntegerField(default=0, blank=True)
    magic_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    magical_damage_taken = models.IntegerField(default=0, blank=True)
    neutral_minions_killed = models.IntegerField(default=0, blank=True)
    penta_kills = models.IntegerField(default=0, blank=True)

    perk_0 = models.IntegerField(default=0, blank=True)
    perk_0_var_1 = models.IntegerField(default=0, blank=True)
    perk_0_var_2 = models.IntegerField(default=0, blank=True)
    perk_0_var_3 = models.IntegerField(default=0, blank=True)

    perk_1 = models.IntegerField(default=0, blank=True)
    perk_1_var_1 = models.IntegerField(default=0, blank=True)
    perk_1_var_2 = models.IntegerField(default=0, blank=True)
    perk_1_var_3 = models.IntegerField(default=0, blank=True)

    perk_2 = models.IntegerField(default=0, blank=True)
    perk_2_var_1 = models.IntegerField(default=0, blank=True)
    perk_2_var_2 = models.IntegerField(default=0, blank=True)
    perk_2_var_3 = models.IntegerField(default=0, blank=True)

    perk_3 = models.IntegerField(default=0, blank=True)
    perk_3_var_1 = models.IntegerField(default=0, blank=True)
    perk_3_var_2 = models.IntegerField(default=0, blank=True)
    perk_3_var_3 = models.IntegerField(default=0, blank=True)

    perk_4 = models.IntegerField(default=0, blank=True)
    perk_4_var_1 = models.IntegerField(default=0, blank=True)
    perk_4_var_2 = models.IntegerField(default=0, blank=True)
    perk_4_var_3 = models.IntegerField(default=0, blank=True)

    perk_5 = models.IntegerField(default=0, blank=True)
    perk_5_var_1 = models.IntegerField(default=0, blank=True)
    perk_5_var_2 = models.IntegerField(default=0, blank=True)
    perk_5_var_3 = models.IntegerField(default=0, blank=True)

    perk_primary_style = models.IntegerField(default=0, blank=True)
    perk_sub_style = models.IntegerField(default=0, blank=True)
    physical_damage_dealt = models.IntegerField(default=0, blank=True)
    physical_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    physical_damage_taken = models.IntegerField(default=0, blank=True)

    quadra_kills = models.IntegerField(default=0, blank=True)

    stat_perk_0 = models.IntegerField(default=0, blank=True)
    stat_perk_1 = models.IntegerField(default=0, blank=True)
    stat_perk_2 = models.IntegerField(default=0, blank=True)

    spell_1_casts = models.IntegerField(default=0, blank=True)
    spell_2_casts = models.IntegerField(default=0, blank=True)
    spell_3_casts = models.IntegerField(default=0, blank=True)
    spell_4_casts = models.IntegerField(default=0, blank=True)

    time_ccing_others = models.IntegerField(default=0, blank=True)
    total_damage_dealt = models.IntegerField(default=0, blank=True)
    total_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    total_damage_taken = models.IntegerField(default=0, blank=True)
    total_heal = models.IntegerField(default=0, blank=True)
    total_heals_on_teammates = models.IntegerField(default=0, blank=True)
    total_damage_shielded_on_teammates = models.IntegerField(default=0)
    total_minions_killed = models.IntegerField(default=0, blank=True)
    total_time_crowd_control_dealt = models.IntegerField(default=0, blank=True)
    total_units_healed = models.IntegerField(default=0, blank=True)
    total_ally_jungle_minions_killed = models.IntegerField(default=0, blank=True)
    total_enemy_jungle_minions_killed = models.IntegerField(default=0, blank=True)
    triple_kills = models.IntegerField(default=0, blank=True)
    true_damage_dealt = models.IntegerField(default=0, blank=True)
    true_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    true_damage_taken = models.IntegerField(default=0, blank=True)
    vision_score = models.IntegerField(default=0, blank=True)
    vision_wards_bought_in_game = models.IntegerField(default=0, blank=True)
    wards_killed = models.IntegerField(default=0, blank=True)
    wards_placed = models.IntegerField(default=0, blank=True)
    win = models.BooleanField(default=False, blank=True)

    all_in_pings = models.IntegerField(default=0, blank=True)
    assist_me_pings = models.IntegerField(default=0, blank=True)
    bait_pings = models.IntegerField(default=0, blank=True)
    basic_pings = models.IntegerField(default=0, blank=True)
    command_pings = models.IntegerField(default=0, blank=True)
    danger_pings = models.IntegerField(default=0, blank=True)
    enemy_missing_pings = models.IntegerField(default=0, blank=True)
    enemy_vision_pings = models.IntegerField(default=0, blank=True)
    get_back_pings = models.IntegerField(default=0, blank=True)
    hold_pings = models.IntegerField(default=0, blank=True)
    need_vision_pings = models.IntegerField(default=0, blank=True)
    on_my_way_pings = models.IntegerField(default=0, blank=True)
    push_pings = models.IntegerField(default=0, blank=True)
    vision_cleared_pings = models.IntegerField(default=0, blank=True)

    game_ended_in_early_surrender = models.BooleanField(default=False, blank=True)
    game_ended_in_surrender = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f"Stats(participant={self.participant.summoner_name})"

    @cached_property
    def cs(self):
        return self.neutral_minions_killed + self.total_minions_killed

    @cached_property
    def total_pings(self):
        return sum((
            self.all_in_pings,
            self.assist_me_pings,
            self.bait_pings,
            self.basic_pings,
            self.command_pings,
            self.danger_pings,
            self.enemy_missing_pings,
            self.enemy_vision_pings,
            self.get_back_pings,
            self.hold_pings,
            self.need_vision_pings,
            self.on_my_way_pings,
            self.push_pings,
            self.vision_cleared_pings,
        ))

    def perk_primary_style_image_url(self):
        """Get primary perk style image URL."""
        url = ""
        query = ReforgedTree.objects.filter(_id=self.perk_primary_style).order_by(
            "-version"
        )
        if perk := query.first():
            url = perk.image_url()
        return url

    def perk_sub_style_image_url(self):
        """Get perk sub style image URL."""
        url = ""
        query = ReforgedTree.objects.filter(_id=self.perk_sub_style).order_by(
            "-major",
            "-minor",
        )
        if perk := query.first():
            url = perk.image_url()
        return url

    def get_perk_image(self, number):
        """Get perk image URL."""
        url = ""
        try:
            value = getattr(self, f"perk_{number}")
        except:
            pass
        else:
            query = ReforgedRune.objects.filter(_id=value).order_by(
                "-reforgedtree__version"
            )
            if perk := query.first():
                url = perk.image_url()
        return url

    def perk_0_image_url(self):
        return self.get_perk_image(0)

    def perk_1_image_url(self):
        return self.get_perk_image(1)

    def perk_2_image_url(self):
        return self.get_perk_image(2)

    def perk_3_image_url(self):
        return self.get_perk_image(3)

    def perk_4_image_url(self):
        return self.get_perk_image(4)

    def perk_5_image_url(self):
        return self.get_perk_image(5)

    def get_item_image_url(self, number, major=None, minor=None):
        """Get item image URL."""
        url = ""
        try:
            item_id = getattr(self, f"item_{number}")
        except:
            pass
        else:
            query = Item.objects.filter(_id=item_id).order_by(
                "-major", "-minor", "-patch"
            )
            version_query = query.filter(major=major, minor=minor)
            if all(
                [
                    major is not None,
                    minor is not None,
                    version_query.exists(),
                ]
            ):
                try:
                    item = version_query[:1].get()
                    url = item.image_url()
                except ObjectDoesNotExist:
                    pass
            elif item := query.first():
                url = item.image_url()
        return url

    def item_0_image_url(self, major=None, minor=None):
        return self.get_item_image_url(0, major=major, minor=minor)

    def item_1_image_url(self, major=None, minor=None):
        return self.get_item_image_url(1, major=major, minor=minor)

    def item_2_image_url(self, major=None, minor=None):
        return self.get_item_image_url(2, major=major, minor=minor)

    def item_3_image_url(self, major=None, minor=None):
        return self.get_item_image_url(3, major=major, minor=minor)

    def item_4_image_url(self, major=None, minor=None):
        return self.get_item_image_url(4, major=major, minor=minor)

    def item_5_image_url(self, major=None, minor=None):
        return self.get_item_image_url(5, major=major, minor=minor)

    def item_6_image_url(self, major=None, minor=None):
        return self.get_item_image_url(6, major=major, minor=minor)


class Team(models.Model):
    id: int | None
    match = models.ForeignKey['Match']("Match", on_delete=models.CASCADE, related_name="teams")
    _id = models.IntegerField()
    bans: QuerySet['Ban']

    baron_kills = models.IntegerField(default=0, blank=True)
    dominion_victory_score = models.IntegerField(default=0, blank=True)
    dragon_kills = models.IntegerField(default=0, blank=True)
    first_baron = models.BooleanField(default=False, blank=True)
    first_blood = models.BooleanField(default=False, blank=True)
    first_dragon = models.BooleanField(default=False, blank=True)
    first_inhibitor = models.BooleanField(default=False, blank=True)
    first_rift_herald = models.BooleanField(default=False, blank=True)
    first_tower = models.BooleanField(default=False, blank=True)
    inhibitor_kills = models.IntegerField(default=0, blank=True)
    rift_herald_kills = models.IntegerField(default=0, blank=True)
    tower_kills = models.IntegerField(default=0, blank=True)
    vilemaw_kills = models.IntegerField(default=0, blank=True)
    # this is a string field in the api but it should be a boolean?
    win = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f"Team(match={self.match._id}, _id={self._id})"

    class Meta:
        unique_together = ("_id", "match")

    @property
    def external_id(self):
        return self._id


class Ban(models.Model):
    id: int | None
    team = models.ForeignKey("Team", on_delete=models.CASCADE, related_name="bans")
    champion_id = models.IntegerField()
    pick_turn = models.IntegerField()

    def __str__(self):
        return f"Ban(team={self.team._id}, match={self.team.match._id})"

    class Meta:
        unique_together = ("team", "pick_turn")


class Bounty(BaseModel):
    monster_bounty: int = 0
    champion_kill_bounty: int = 0
    champion_kill_gold: int = 0
    champion_assist_gold: int = 0
    building_bounty: int = 0

    champion_kill_bounty_given: int = 0
    champion_kill_gold_given: int = 0  # not including bounty gold
    champion_assist_gold_given: int = 0

    @computed_field
    @property
    def total_gold_given(self) -> int:
        return self.champion_kill_bounty_given + self.champion_kill_gold_given + self.champion_assist_gold_given

    @computed_field
    @property
    def total_bounty_received(self) -> int:
        return self.monster_bounty + self.champion_kill_bounty + self.building_bounty


# ADVANCED TIMELINE MODELS
class AdvancedTimeline(models.Model):
    # interval in milliseconds
    id: int | None
    match = models.OneToOneField("Match", on_delete=models.CASCADE)
    frame_interval = models.IntegerField(default=60000, blank=True)

    frames: QuerySet['Frame']

    def __str__(self):
        return f"AdvancedTimeline(match={self.match._id})"

    @cached_property
    def _bounties(self):
        participants: QuerySet[Participant] = self.match.participants.all()
        teams = {x._id: x.team_id for x in participants}
        team_ids = {x for x in teams.values()}
        team_size = int(len(teams) / len(team_ids)) or 1
        bounties: dict[int, Bounty] = {x._id: Bounty() for x in participants}
        for frame in self.frames.all():
            for event in frame.elitemonsterkillevent_set.all():
                partial_bounty = event.bounty / team_size
                for p_id, team_id in teams.items():
                    if team_id == event.killer_team_id:
                        bounties[p_id].monster_bounty += partial_bounty

            for event in frame.buildingkillevent_set.all():
                partial_bounty = event.bounty / team_size
                for p_id, team_id in teams.items():
                    if team_id == event.team_id:
                        bounties[p_id].building_bounty += partial_bounty

            for event in frame.championkillevent_set.all():
                if event.killer_id == 0:
                    continue
                bounties[event.killer_id].champion_kill_gold += event.bounty
                bounties[event.killer_id].champion_kill_bounty += event.shutdown_bounty

                bounties[event.victim_id].champion_kill_gold_given += event.bounty
                bounties[event.victim_id].champion_kill_bounty_given += event.shutdown_bounty

                assisters = [
                    x for x in event.victimdamagereceived_set.all()
                    if x.participant_id not in (0, event.killer_id)
                ]
                total_assist_gold = 0
                partial_assist_gold = 0
                if assisters:
                    total_assist_gold = event.bounty / 2
                    partial_assist_gold = total_assist_gold / len(assisters)
                    bounties[event.victim_id].champion_assist_gold_given += total_assist_gold

                for assist in assisters:
                    bounties[assist.participant_id].champion_assist_gold += partial_assist_gold


        team_bounties: dict[int, int] = {x: 0 for x in team_ids}
        for p_id, bounty in bounties.items():
            team_id = teams[p_id]
            team_bounties[team_id] += bounty.total_bounty_received
        return team_bounties, bounties

    @cached_property
    def bounties(self):
        return self._bounties[1]

    @cached_property
    def team_bounties(self):
        return self._bounties[0]


class Frame(models.Model):
    id: int | None
    timeline = models.ForeignKey(
        "AdvancedTimeline", on_delete=models.CASCADE, related_name="frames"
    )
    timestamp = models.IntegerField(null=True, blank=True)

    elitemonsterkillevent_set: QuerySet['EliteMonsterKillEvent']
    buildingkillevent_set: QuerySet['BuildingKillEvent']
    championkillevent_set: QuerySet['ChampionKillEvent']
    participantframes: QuerySet['ParticipantFrame']

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"Frame(match={self.timeline.match._id}, timestamp={self.timestamp})"

    @cached_property
    def team_gold(self):
        teams = {x._id: x.team_id for x in self.timeline.match.participants.all()}
        gold = {x: 0 for x in teams.values()}
        for pf in self.participantframes.all():
            if team := teams.get(pf.participant_id, None):
                gold[team] += pf.total_gold
        return gold

    def team100_gold(self):
        return self.team_gold.get(100, 0)

    def team200_gold(self):
        return self.team_gold.get(200, 0)


class ParticipantFrame(models.Model):
    id: int | None
    frame = models.ForeignKey['Frame'](
        "Frame", on_delete=models.CASCADE, related_name="participantframes"
    )
    participant_id = models.IntegerField(default=0, blank=True)
    current_gold = models.IntegerField(default=0, blank=True)
    gold_per_second = models.IntegerField(default=0, blank=True)
    jungle_minions_killed = models.IntegerField(default=0, blank=True)
    level = models.IntegerField(default=1, blank=True)
    minions_killed = models.IntegerField(default=0, blank=True)
    team_score = models.IntegerField(default=0, blank=True)
    total_gold = models.IntegerField(default=0, blank=True)
    time_enemy_spent_controlled = models.IntegerField(default=0, blank=True)
    xp = models.IntegerField(default=0, blank=True)
    x = models.IntegerField(default=0, blank=True)
    y = models.IntegerField(default=0, blank=True)

    # champion stats
    ability_haste = models.IntegerField(default=0, blank=True)
    ability_power = models.IntegerField(default=0, blank=True)
    armor = models.IntegerField(default=0, blank=True)
    armor_pen = models.IntegerField(default=0, blank=True)
    armor_pen_percent = models.IntegerField(default=0, blank=True)
    attack_damage = models.IntegerField(default=0, blank=True)
    attack_speed = models.IntegerField(default=0, blank=True)
    bonus_armor_pen_percent = models.IntegerField(default=0, blank=True)
    bonus_magic_pen_percent = models.IntegerField(default=0, blank=True)
    cc_reduction = models.IntegerField(default=0, blank=True)
    cooldown_reduction = models.IntegerField(default=0, blank=True)
    health = models.IntegerField(default=0, blank=True)
    health_max = models.IntegerField(default=0, blank=True)
    health_regen = models.IntegerField(default=0, blank=True)
    lifesteal = models.IntegerField(default=0, blank=True)
    magic_pen = models.IntegerField(default=0, blank=True)
    magic_pen_percent = models.IntegerField(default=0, blank=True)
    magic_resist = models.IntegerField(default=0, blank=True)
    movement_speed = models.IntegerField(default=0, blank=True)
    omnivamp = models.IntegerField(default=0, blank=True)
    physical_vamp = models.IntegerField(default=0, blank=True)
    power = models.IntegerField(default=0, blank=True)
    power_max = models.IntegerField(default=0, blank=True)
    power_regen = models.IntegerField(default=0, blank=True)
    spell_vamp = models.IntegerField(default=0, blank=True)

    # damage stats
    magic_damage_done = models.IntegerField(default=0, blank=True)
    magic_damage_done_to_champions = models.IntegerField(default=0, blank=True)
    magic_damage_taken = models.IntegerField(default=0, blank=True)
    physical_damage_done = models.IntegerField(default=0, blank=True)
    physical_damage_done_to_champions = models.IntegerField(default=0, blank=True)
    physical_damage_taken = models.IntegerField(default=0, blank=True)
    total_damage_done = models.IntegerField(default=0, blank=True)
    total_damage_done_to_champions = models.IntegerField(default=0, blank=True)
    total_damage_taken = models.IntegerField(default=0, blank=True)
    true_damage_done = models.IntegerField(default=0, blank=True)
    true_damage_done_to_champions = models.IntegerField(default=0, blank=True)
    true_damage_taken = models.IntegerField(default=0, blank=True)

    def __str__(self):
        return (
            f"ParticipantFrame(match={self.frame.timeline.match._id},"
            + " frame={self.frame.id}, participant_id={self.participant_id})"
        )


class Event(models.Model):
    id: int | None
    frame = models.ForeignKey['Frame']("Frame", on_delete=models.CASCADE)
    timestamp = models.IntegerField(default=0, blank=True)

    class Meta:
        abstract = True

    def formatted_timestamp(self):
        total_seconds = self.timestamp / 1000
        minutes, seconds = divmod(total_seconds, 60)
        return f"{int(minutes)}m {int(seconds)}s"


class WardKillEvent(Event):
    id: int | None
    killer_id = models.PositiveSmallIntegerField()
    ward_type = models.CharField(max_length=32)


class WardPlacedEvent(Event):
    id: int | None
    creator_id = models.PositiveSmallIntegerField()
    ward_type = models.CharField(max_length=32)


class LevelUpEvent(Event):
    id: int | None
    level = models.PositiveSmallIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class SkillLevelUpEvent(Event):
    id: int | None
    level_up_type = models.CharField(max_length=32)
    participant_id = models.PositiveSmallIntegerField()
    skill_slot = models.PositiveSmallIntegerField()


class ItemPurchasedEvent(Event):
    id: int | None
    item_id = models.PositiveIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemDestroyedEvent(Event):
    id: int | None
    item_id = models.PositiveIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemSoldEvent(Event):
    id: int | None
    item_id = models.PositiveIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemUndoEvent(Event):
    id: int | None
    participant_id = models.PositiveSmallIntegerField()
    before_id = models.PositiveIntegerField()
    after_id = models.PositiveIntegerField()
    gold_gain = models.SmallIntegerField()


class TurretPlateDestroyedEvent(Event):
    id: int | None
    killer_id = models.PositiveSmallIntegerField()
    lane_type = models.CharField(max_length=16)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()
    team_id = models.PositiveSmallIntegerField()


class EliteMonsterKillEvent(Event):
    id: int | None
    killer_id = models.PositiveSmallIntegerField()
    bounty = models.PositiveIntegerField(default=0, blank=True)
    assisting_participant_ids = ArrayField(
        models.PositiveSmallIntegerField(), blank=True, null=True
    )
    killer_team_id = models.PositiveSmallIntegerField()
    monster_type = models.CharField(max_length=64)
    monster_sub_type = models.CharField(max_length=64, null=True)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()

    def monster_name(self):
        match [self.monster_type, self.monster_sub_type]:
            case ['HORDE', _]:
                return 'Grubs'
        out = self.monster_type
        if self.monster_sub_type:
            out += ': ' + self.monster_sub_type
        return ' '.join(out.split('_')).lower().title()


class ChampionSpecialKillEvent(Event):
    id: int | None
    assisting_participant_ids = ArrayField(
        models.PositiveSmallIntegerField(), null=True
    )
    kill_type = models.CharField(max_length=32)
    killer_id = models.PositiveSmallIntegerField()
    multi_kill_length = models.PositiveSmallIntegerField(default=None, null=True)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()


class BuildingKillEvent(Event):
    id: int | None
    assisting_participant_ids = ArrayField(
        models.PositiveSmallIntegerField(), null=True
    )
    building_type = models.CharField(max_length=32)
    bounty = models.PositiveIntegerField(default=0, blank=True)
    killer_id = models.PositiveSmallIntegerField()
    lane_type = models.CharField(max_length=32)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()
    team_id = models.PositiveSmallIntegerField()
    tower_type = models.CharField(max_length=32, null=True)


class GameEndEvent(Event):
    id: int | None
    game_id = models.PositiveBigIntegerField()
    real_timestamp = models.PositiveBigIntegerField()
    winning_team = models.PositiveSmallIntegerField()


class ChampionKillEvent(Event):
    id: int | None
    bounty = models.PositiveSmallIntegerField()
    shutdown_bounty = models.PositiveIntegerField(default=0, blank=True)
    kill_streak_length = models.PositiveSmallIntegerField()
    killer_id = models.PositiveSmallIntegerField()
    victim_id = models.PositiveSmallIntegerField()
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()

    victimdamagereceived_set: QuerySet['VictimDamageReceived']
    victimdamagedealt_set: QuerySet['VictimDamageDealt']

    def assisters(self):
        ret = {}
        for vd in self.victimdamagereceived_set.all():
            if vd.participant_id != 0:
                key = vd.participant_id
            else:
                key = vd.get_name()
            if key not in ret:
                ret[key] = {
                    'total_damage': 0,
                    'name': vd.get_name(),
                    'participant_id': vd.participant_id,
                }
            ret[key]['total_damage'] += vd.total_damage()
        out = list(ret.values())
        out.sort(key=lambda x: -x['total_damage'])
        return out


class VictimDamage(models.Model):
    id: int | None
    championkillevent = models.ForeignKey(ChampionKillEvent, on_delete=models.CASCADE)
    basic = models.BooleanField(default=False)
    magic_damage = models.IntegerField()
    name = models.CharField(max_length=32)
    participant_id = models.PositiveSmallIntegerField()
    physical_damage = models.IntegerField()
    spell_name = models.CharField(max_length=64)
    spell_slot = models.IntegerField()
    true_damage = models.IntegerField()
    type = models.CharField(max_length=32)

    class Meta:
        abstract = True

    def total_damage(self):
        return self.magic_damage + self.physical_damage + self.true_damage

    def get_name(self):
        name = self.name.lower()
        if 'minion' in name:
            return "Minions"
        elif 'turret' in name:
            return "Tower"
        elif 'razorbeak' in name:
            return "Birds"
        elif 'horde' in name:
            return 'Grubs'
        elif 'dragon' in name:
            return 'Dragon'
        elif name == 'sru_blue':
            return 'Blue Buff'
        elif name == 'sru_red':
            return 'Red Buff'
        elif 'murkwolf' in name:
            return 'Wolves'
        elif 'gromp' in name:
            return 'Gromp'
        elif 'baron' in name:
            return 'Baron'
        elif 'riftherald' in name:
            return 'Rift Herald'
        elif 'krug' in name:
            return 'Krugs'
        return self.name


class VictimDamageReceived(VictimDamage):
    pass


class VictimDamageDealt(VictimDamage):
    pass


# END ADVANCED TIMELINE MODELS


class Spectate(models.Model):
    id: int | None
    game_id = models.CharField(max_length=128, default="", blank=True)
    encryption_key = models.CharField(max_length=256, default="", blank=True)
    platform_id = models.CharField(max_length=32, default="", blank=True)
    region = models.CharField(max_length=32, default="", blank=True)

    class Meta:
       unique_together = ("game_id", "region")
