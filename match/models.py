"""match.models
"""
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

import pytz
import logging

from core.models import VersionedModel
from data.models import ReforgedTree, ReforgedRune
from data.models import Item, SummonerSpellImage
from data.models import SummonerSpell, Champion
from data import constants as DATA_CONSTANTS

from player.models import simplify

logger = logging.getLogger(__name__)


def sort_positions(positions):
    """Uses tier_sort, rank_sort and lp_sort to sort positions by descending rank.
    """
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
    tier_order = [
        "challenger",
        "grandmaster",
        "master",
        "diamond",
        "platinum",
        "gold",
        "silver",
        "bronze",
        "iron",
    ]
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
    division_order = ["i", "ii", "iii", "iv", "v"]
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


class MatchQuerySet(models.QuerySet):

    def get_items(self, puuid=None):
        item_ids = set()
        qs = Stats.objects.filter(participant__match__in=self)
        if puuid is not None:
            qs = qs.filter(participant__puuid=puuid)
        for stat in qs:
            for i in range(7):
                key = f'item_{i}'
                item_id = getattr(stat, key)
                item_ids.add(item_id)
        qs = Item.objects.filter(_id__in=item_ids)
        qs = qs.order_by('_id', '-major', '-minor')
        qs = qs.distinct('_id').select_related('image')
        return {x._id: x for x in qs}

    def get_champs(self):
        champ_ids = set()
        for match in self.prefetch_related('participants'):
            for part in match.participants.all():
                champ_ids.add(part.champion_id)
        qs = Champion.objects.filter(key__in=champ_ids, language='en_US')
        qs = qs.order_by('key', '-major', '-minor').distinct('key').select_related('image')
        return {x.key: x for x in qs}

    def get_spell_images(self):
        spell_ids = set()
        for match in self.prefetch_related('participants'):
            for part in match.participants.all():
                spell_ids.add(part.summoner_1_id)
                spell_ids.add(part.summoner_2_id)
        qs = SummonerSpellImage.objects.filter(spell__key__in=spell_ids)
        qs = qs.select_related('spell')
        qs = qs.order_by('spell___id', '-spell__major', '-spell__minor').distinct('spell___id')
        return {x.spell.key: x.image_url() for x in qs}

    def get_perk_substyles(self):
        substyles = set()
        for match in self.prefetch_related('participants'):
            for part in match.participants.all().select_related('stats'):
                substyles.add(part.stats.perk_sub_style)
        qs = ReforgedTree.objects.filter(_id__in=substyles)
        qs = qs.order_by('_id', '-major', '-minor').distinct('_id')
        return {x._id: x.image_url() for x in qs}

    def get_runes(self):
        all_runes = set()
        for match in self.prefetch_related('participants'):
            for part in match.participants.all():
                for _i in range(6):
                    all_runes.add(getattr(part.stats, f'perk_{_i}'))

        rune_data = ReforgedRune.objects.filter(
            _id__in=all_runes,
        ).order_by(
            '_id', '-reforgedtree__major', 'reforgedtree__minor'
        ).distinct('_id')
        return {x._id: x for x in rune_data}

    def get_related(self):
        return {
            'items': self.get_items(),
            'runes': self.get_runes(),
            'perk_substyles': self.get_perk_substyles(),
            'champs': self.get_champs(),
            'spell_images': self.get_spell_images(),
        }


class Match(VersionedModel):
    _id = models.CharField(unique=True, db_index=True, max_length=32)
    game_creation = models.BigIntegerField(db_index=True)
    game_duration = models.IntegerField()
    game_mode = models.CharField(max_length=32, default="", blank=True)
    game_type = models.CharField(max_length=32, default="", blank=True)
    map_id = models.IntegerField()
    platform_id = models.CharField(max_length=16, default="", blank=True)
    queue_id = models.IntegerField(db_index=True)
    season_id = models.IntegerField(null=True)
    game_version = models.CharField(max_length=32, default="", blank=True)
    build = models.IntegerField()
    is_fully_imported = models.BooleanField(default=False, blank=True, db_index=True)

    objects = MatchQuerySet.as_manager()

    def __str__(self):
        return f"Match(_id={self._id}, queue_id={self.queue_id}, game_version={self.game_version})"

    def get_absolute_url(self, pname=None):
        """Get url of match.

        Parameters
        ----------
        pname : str
            Summoner name

        Returns
        -------
        str

        """
        if pname is None:
            pname = ""
            try:
                pname = self.participants.all().first().summoner_name_simplified
            except:
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

    def get_creation(self):
        """Get creation as datetime
        """
        dt = timezone.datetime.fromtimestamp(self.game_creation // 1000, tz=pytz.utc)
        return dt

    def tier_average(self):
        """Compute tier average.
        """
        major = self.major
        try:
            tiers = getattr(DATA_CONSTANTS, f"TIERS_{major}")
        except:
            output = ""
        else:
            all_tiers = []
            for part in self.participants.all():
                if part.highest_achieved_season_tier:
                    index = tiers.index(part.highest_achieved_season_tier.lower())
                    all_tiers.append(index)
            if all_tiers:
                output_index = int(sum(all_tiers) / len(all_tiers))
                output = tiers[output_index]
            else:
                output = ""
        return output.title()

    def get_comment_count(self):
        return self.comments.all().count()

    def is_summoner_in_game(self, summoner):
        """Find if a summoner is in the game.
        """
        query = self.participants.filter(puuid=summoner.puuid)
        return query.exists()


class Participant(models.Model):
    match = models.ForeignKey(
        "Match", on_delete=models.CASCADE, related_name="participants"
    )
    _id = models.IntegerField(db_index=True)  # participantID

    summoner_id = models.CharField(
        max_length=128, default="", blank=True, null=True, db_index=True
    )
    puuid = models.CharField(max_length=128, default=None, db_index=True, null=True)
    summoner_name = models.CharField(max_length=256, default="", blank=True)
    summoner_name_simplified = models.CharField(
        max_length=128, default="", blank=True, db_index=True
    )

    champion_id = models.IntegerField(db_index=True)
    champ_experience = models.IntegerField(default=None, null=True, blank=True)
    summoner_1_id = models.IntegerField()
    summoner_1_casts = models.IntegerField(default=0)
    summoner_2_id = models.IntegerField()
    summoner_2_casts = models.IntegerField(default=0)
    team_id = models.IntegerField()

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

    class Meta:
        unique_together = ("match", "_id")

    def save(self, *args, **kwargs):
        self.summoner_name_simplified = simplify(self.summoner_name)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Participant(summoner_name={self.summoner_name}, match={self.match._id})"
        )

    def get_champion(self):
        return Champion.objects.filter(key=self.champion_id).order_by('-major', '-minor').first()

    def spell_1_image_url(self):
        """Get spell 1 image URL.
        """
        url = ""
        query = SummonerSpell.objects.filter(key=self.spell_1_id)
        if query.exists():
            spell = query.first()
            url = spell.image_url()
        return url

    def spell_2_image_url(self):
        """Get spell 2 image URL.
        """
        url = ""
        query = SummonerSpell.objects.filter(key=self.spell_2_id)
        if query.exists():
            spell = query.first()
            url = spell.image_url()
        return url

    def as_data_row(self, max_spell=70, max_champ=1000, team=None):
        convert_lane = {
            "NONE": 0,
            "TOP": 1,
            "JUNGLE": 2,
            "MIDDLE": 3,
            "BOTTOM": 4,
        }
        lane = [0] * 5
        lane[convert_lane[self.lane]] = 1

        spells = [0] * max_spell
        spells[self.summoner_1_id] = 1
        spells[self.summoner_2_id] = 1

        champions = [0] * max_champ
        champions[self.champion_id] = 1

        max_vs = 1
        max_dmg = 1
        max_gold = 1
        if team is None:
            team = self.match.participants.filter(team_id=self.team_id).select_related('stats')
        for part in team:
            if part.stats.vision_score > max_vs:
                max_vs = part.stats.vision_score
            if part.stats.total_damage_dealt_to_champions > max_dmg:
                max_dmg = part.stats.total_damage_dealt_to_champions
            if part.stats.gold_earned > max_gold:
                max_gold = part.stats.gold_earned
        stat_data = [
            self.stats.vision_score / max_vs,
            self.stats.total_damage_dealt_to_champions / max_dmg,
            self.stats.gold_earned / max_gold,
        ]

        data = lane + spells + champions + stat_data
        return data


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
    first_inhibitor_assist = models.BooleanField(default=False, blank=True)
    first_inhibitor_kill = models.BooleanField(default=False, blank=True)
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
    killing_sprees = models.IntegerField(default=0, blank=True)
    kills = models.IntegerField(default=0, blank=True)
    largest_critical_strike = models.IntegerField(default=0, blank=True)
    largest_killing_spree = models.IntegerField(default=0, blank=True)
    largest_multi_kill = models.IntegerField(default=0, blank=True)
    longest_time_spent_living = models.IntegerField(default=0, blank=True)
    magic_damage_dealt = models.IntegerField(default=0, blank=True)
    magic_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    magical_damage_taken = models.IntegerField(default=0, blank=True)
    neutral_minions_killed = models.IntegerField(default=0, blank=True)
    neutral_minions_killed_enemy_jungle = models.IntegerField(default=0, blank=True)
    neutral_minions_killed_team_jungle = models.IntegerField(default=0, blank=True)
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
    sight_wards_bought_in_game = models.IntegerField(default=0, blank=True)

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
    triple_kills = models.IntegerField(default=0, blank=True)
    true_damage_dealt = models.IntegerField(default=0, blank=True)
    true_damage_dealt_to_champions = models.IntegerField(default=0, blank=True)
    true_damage_taken = models.IntegerField(default=0, blank=True)
    turret_kills = models.IntegerField(default=0, blank=True)
    unreal_kills = models.IntegerField(default=0, blank=True)
    vision_score = models.IntegerField(default=0, blank=True)
    vision_wards_bought_in_game = models.IntegerField(default=0, blank=True)
    wards_killed = models.IntegerField(default=0, blank=True)
    wards_placed = models.IntegerField(default=0, blank=True)
    detector_wards_placed = models.IntegerField(default=0, blank=True)
    win = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f"Stats(participant={self.participant.summoner_name})"

    def perk_primary_style_image_url(self):
        """Get primary perk style image URL.
        """
        url = ""
        query = ReforgedTree.objects.filter(_id=self.perk_primary_style).order_by(
            "-version"
        )
        if query.exists():
            perk = query.first()
            url = perk.image_url()
        return url

    def perk_sub_style_image_url(self):
        """Get perk sub style image URL.
        """
        url = ""
        query = ReforgedTree.objects.filter(_id=self.perk_sub_style).order_by(
            "-major", "-minor",
        )
        if query.exists():
            perk = query.first()
            url = perk.image_url()
        return url

    def get_perk_image(self, number):
        """Get perk image URL.
        """
        url = ""
        try:
            value = getattr(self, f"perk_{number}")
        except:
            pass
        else:
            query = ReforgedRune.objects.filter(_id=value).order_by(
                "-reforgedtree__version"
            )
            if query.exists():
                perk = query.first()
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
        """Get item image URL.
        """
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
            if all([
                major is not None,
                minor is not None,
                version_query.exists(),
            ]):
                item = version_query.first()
                url = item.image_url()
            elif query.exists():
                item = query.first()
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
    match = models.ForeignKey("Match", on_delete=models.CASCADE, related_name="teams")
    _id = models.IntegerField()

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


class Ban(models.Model):
    team = models.ForeignKey("Team", on_delete=models.CASCADE, related_name="bans")
    champion_id = models.IntegerField()
    pick_turn = models.IntegerField()

    def __str__(self):
        return f"Ban(team={self.team._id}, match={self.team.match._id})"


# ADVANCED TIMELINE MODELS
class AdvancedTimeline(models.Model):
    # interval in milliseconds
    match = models.OneToOneField("Match", on_delete=models.CASCADE)
    frame_interval = models.IntegerField(default=60000, blank=True)

    def __str__(self):
        return f"AdvancedTimeline(match={self.match._id})"


class Frame(models.Model):
    timeline = models.ForeignKey(
        "AdvancedTimeline", on_delete=models.CASCADE, related_name="frames"
    )
    timestamp = models.IntegerField(null=True, blank=True, db_index=True)

    def __str__(self):
        return f"Frame(match={self.timeline.match._id}, timestamp={self.timestamp})"


class ParticipantFrame(models.Model):
    frame = models.ForeignKey(
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
    frame = models.ForeignKey("Frame", on_delete=models.CASCADE)
    timestamp = models.IntegerField(default=0, blank=True)

    class Meta:
        abstract = True


class WardKillEvent(Event):
    killer_id = models.PositiveSmallIntegerField()
    ward_type = models.CharField(max_length=32)


class WardPlacedEvent(Event):
    creator_id = models.PositiveSmallIntegerField()
    ward_type = models.CharField(max_length=32)


class LevelUpEvent(Event):
    level = models.PositiveSmallIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class SkillLevelUpEvent(Event):
    level_up_type = models.CharField(max_length=32)
    participant_id = models.PositiveSmallIntegerField()
    skill_slot = models.PositiveSmallIntegerField()


class ItemPurchasedEvent(Event):
    item_id = models.PositiveSmallIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemDestroyedEvent(Event):
    item_id = models.PositiveSmallIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemSoldEvent(Event):
    item_id = models.PositiveSmallIntegerField()
    participant_id = models.PositiveSmallIntegerField()


class ItemUndoEvent(Event):
    participant_id = models.PositiveSmallIntegerField()
    before_id = models.PositiveSmallIntegerField()
    after_id = models.PositiveSmallIntegerField()
    gold_gain = models.SmallIntegerField()


class TurretPlateDestroyedEvent(Event):
    killer_id = models.PositiveSmallIntegerField()
    lane_type = models.CharField(max_length=16)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()
    team_id = models.PositiveSmallIntegerField()


class EliteMonsterKillEvent(Event):
    killer_id = models.PositiveSmallIntegerField()
    assisting_participant_ids = ArrayField(models.PositiveSmallIntegerField(), blank=True, null=True)
    killer_team_id = models.PositiveSmallIntegerField()
    monster_type = models.CharField(max_length=64)
    monster_sub_type = models.CharField(max_length=64, null=True)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()


class ChampionSpecialKillEvent(Event):
    assisting_participant_ids = ArrayField(models.PositiveSmallIntegerField(), null=True)
    kill_type = models.CharField(max_length=32)
    killer_id = models.PositiveSmallIntegerField()
    multi_kill_length = models.PositiveSmallIntegerField(default=None, null=True)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()


class BuildingKillEvent(Event):
    assisting_participant_ids = ArrayField(models.PositiveSmallIntegerField(), null=True)
    building_type = models.CharField(max_length=32)
    killer_id = models.PositiveSmallIntegerField()
    lane_type = models.CharField(max_length=32)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()
    team_id = models.PositiveSmallIntegerField()
    tower_type = models.CharField(max_length=32, null=True)


class GameEndEvent(Event):
    game_id = models.PositiveBigIntegerField()
    real_timestamp = models.PositiveBigIntegerField()
    winning_team = models.PositiveSmallIntegerField()


class ChampionKillEvent(Event):
    bounty = models.PositiveSmallIntegerField()
    kill_streak_length = models.PositiveSmallIntegerField()
    killer_id = models.PositiveSmallIntegerField()
    victim_id = models.PositiveSmallIntegerField()
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()


class VictimDamage(models.Model):
    championkillevent = models.ForeignKey(ChampionKillEvent, on_delete=models.CASCADE)
    basic = models.BooleanField(default=False)
    magic_damage = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=32)
    participant_id = models.PositiveSmallIntegerField()
    physical_damage = models.PositiveSmallIntegerField()
    spell_name = models.CharField(max_length=64)
    spell_slot = models.SmallIntegerField()
    true_damage = models.PositiveSmallIntegerField()
    type = models.CharField(max_length=32)

    class Meta:
        abstract = True


class VictimDamageReceived(VictimDamage):
    pass


class VictimDamageDealt(VictimDamage):
    pass


# END ADVANCED TIMELINE MODELS


class Spectate(models.Model):
    game_id = models.CharField(max_length=128, default="", blank=True)
    encryption_key = models.CharField(max_length=256, default="", blank=True)
    platform_id = models.CharField(max_length=32, default="", blank=True)
    region = models.CharField(max_length=32, default="", blank=True)

    class Meta:
        unique_together = ("game_id", "region")
