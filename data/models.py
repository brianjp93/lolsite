from typing import Self, Union
from django.db import models
from django.utils import timezone

from core.models import VersionedModel, ThumbnailedModel


class Rito(models.Model):
    token = models.CharField(max_length=256, default="", blank=True)
    versions = models.CharField(max_length=10000, default="[]", blank=True)
    last_data_import = models.DateTimeField(null=True)

    def __str__(self):
        return f'Rito(token="{self.token}")'


class Queue(models.Model):
    _id = models.IntegerField(unique=True)
    _map = models.CharField(max_length=128, default="", blank=True)
    description = models.CharField(max_length=256, default="", blank=True)

    def __str__(self):
        return f'Queue(_id={self._id}, _map="{self._map}")'

    def get_map(self):
        """Return the corresponding map model.
        """
        try:
            return Map.objects.all()[:1].get(name__iexact=self._map)
        except Map.DoesNotExist:
            return None


class Season(models.Model):
    _id = models.IntegerField(unique=True)
    name = models.CharField(max_length=128, default="", blank=True)

    def __str__(self):
        return f'Season(_id={self._id}, name="{self.name}")'


class Map(models.Model):
    _id = models.IntegerField(unique=True)
    name = models.CharField(max_length=256, default="", blank=True)
    notes = models.CharField(max_length=256, default="", blank=True)

    def __str__(self):
        return f'Map(name="{self.name}")'

    def minimap_url(self, version=""):
        """Get minimap image url.

        Parameters
        ----------
        version : str
            if none is provided, try to get latest image

        Returns
        -------
        str

        """
        if version:
            pass
        else:
            query = Item.objects.all().order_by("-major", "-minor", "-patch")
            try:
                item = query[:1].get()
                version = item.version
            except Item.DoesNotExist:
                version = "9.5.1"
        return f"https://ddragon.leagueoflegends.com/cdn/{version}/img/map/map{self._id}.png"


class GameMode(models.Model):
    name = models.CharField(unique=True, max_length=128, default="", blank=True)
    description = models.CharField(max_length=256, default="", blank=True)

    def __str__(self):
        return f'GameMode(name="{self.name}")'


class GameType(models.Model):
    name = models.CharField(unique=True, max_length=128, default="", blank=True)
    description = models.CharField(max_length=256, default="", blank=True)

    def __str__(self):
        return f'GameType(name="{self.name}")'


class ReforgedTree(VersionedModel):
    _id = models.IntegerField(db_index=True)
    language = models.CharField(
        max_length=32, default="en_US", db_index=True, blank=True
    )
    version = models.CharField(max_length=32, default="", db_index=True, blank=True)
    icon = models.CharField(max_length=128, default="", blank=True)
    key = models.CharField(max_length=128, default="", blank=True)
    name = models.CharField(max_length=128, default="", blank=True)

    class Meta:
        unique_together = ("_id", "language", "version")

    def save(self, *args, **kwargs):
        # I don't know how it happens, but sometimes we get the wrong url?
        if '.dds' in self.icon:
            self.icon = self.icon.replace('.dds', '.png')
            self.icon = self.icon.replace('ASSETS/Perks', 'perk-images')
        return super().save(*args, **kwargs)

    def __str__(self):
        return f'ReforgedTree(_id={self._id}, language="{self.language}", version="{self.version}")'

    def image_url(self):
        """Return image url.
        """
        return f"https://ddragon.leagueoflegends.com/cdn/img/{self.icon}"


class ReforgedRune(models.Model):
    reforgedtree = models.ForeignKey(
        "ReforgedTree", on_delete=models.CASCADE, related_name="reforgedrunes"
    )
    _id = models.IntegerField(db_index=True)
    icon = models.CharField(max_length=256, default="", blank=True)
    key = models.CharField(max_length=128, default="", blank=True)
    long_description = models.CharField(max_length=2048, default="", blank=True)
    name = models.CharField(max_length=128, default="", blank=True)
    short_description = models.CharField(max_length=1024, default="", blank=True)
    row = models.IntegerField()
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ("reforgedtree", "_id")

    def image_url(self):
        """Return image url.
        """
        return f"https://ddragon.leagueoflegends.com/cdn/img/{self.icon}"


class Item(VersionedModel):
    _id = models.IntegerField(db_index=True)
    version = models.CharField(max_length=128, default="", db_index=True, blank=True)
    language = models.CharField(
        max_length=32, default="en_US", db_index=True, blank=True
    )
    colloq = models.CharField(max_length=256, default="", blank=True)
    depth = models.IntegerField(null=True)
    group = models.CharField(max_length=128, default="", blank=True)
    description = models.CharField(max_length=2048, default="", blank=True)
    name = models.CharField(max_length=256, default="", blank=True)
    plaintext = models.CharField(max_length=256, default="", blank=True)
    required_ally = models.CharField(max_length=256, default="", blank=True)
    required_champion = models.CharField(max_length=256, default="", blank=True)
    in_store = models.BooleanField(default=True)
    consumed = models.BooleanField(default=False)
    consume_on_full = models.BooleanField(default=False)
    special_recipe = models.IntegerField(null=True, blank=True)
    stacks = models.IntegerField(null=True, blank=True)
    last_changed = models.CharField(max_length=16, default=None, null=True, blank=True)

    image: Union['ItemImage', None]
    gold: Union['ItemGold', None]
    stats: models.QuerySet['ItemStat']

    class Meta:
        unique_together = ("_id", "version", "language")

    def __str__(self):
        return f'Item(name="{self.name}", version="{self.version}", language="{self.language}")'

    def image_url(self):
        url = ""
        if self.image:
            url = self.image.image_url()
        return url

    def is_diff(self, other: Self):
        """Find differences between two items."""
        stat_diffs = {}
        all_stats = set(x.key for x in self.stats.all()) | set(
            x.key for x in other.stats.all()
        )
        all_stats = sorted(list(all_stats))
        for key in all_stats:
            query0 = self.stats.filter(key=key)
            query1 = other.stats.filter(key=key)
            selfstat = query0[:1].get()
            otherstat = query1[:1].get()
            if selfstat and otherstat:
                stat_diffs[key] = selfstat.value == otherstat.value
            else:
                stat_diffs[key] = False
        assert self.gold and other.gold
        diffs = {
            # "description": self.description == other.description,
            "gold__total": self.gold.total == other.gold.total,
            "gold__sell": self.gold.total == other.gold.total,
        }
        if all(diffs.values()) and all(stat_diffs.values()):
            out = False
        else:
            out = {"general": diffs, "stats": stat_diffs}
        return out


class ItemEffect(models.Model):
    item = models.ForeignKey("Item", on_delete=models.CASCADE, related_name="effects")
    key = models.CharField(max_length=256, default="")
    value = models.FloatField()

    class Meta:
        unique_together = ("item", "key")

    def __str__(self):
        return f"ItemEffect(item={self.item._id})"


class FromItem(models.Model):
    item = models.ForeignKey("Item", on_delete=models.CASCADE, related_name="fromitems")
    _id = models.IntegerField()


class IntoItem(models.Model):
    item = models.ForeignKey("Item", on_delete=models.CASCADE, related_name="intoitems")
    _id = models.IntegerField()


class ItemGold(models.Model):
    item = models.OneToOneField("Item", on_delete=models.CASCADE, related_name="gold")
    base = models.IntegerField()
    purchasable = models.BooleanField(default=False)
    sell = models.IntegerField()
    total = models.IntegerField()


class ItemImage(ThumbnailedModel):
    item = models.OneToOneField("Item", on_delete=models.CASCADE, related_name="image")
    full = models.CharField(max_length=128, default="", blank=True)
    group = models.CharField(max_length=128)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def image_url(self):
        """Get item image url.
        """
        return f"https://ddragon.leagueoflegends.com/cdn/{self.item.version}/img/item/{self.full}"


class ItemMap(models.Model):
    item = models.ForeignKey("Item", on_delete=models.CASCADE, related_name="maps")
    key = models.IntegerField()
    value = models.BooleanField()

    class Meta:
        unique_together = ("item", "key")


class ItemStat(models.Model):
    item = models.ForeignKey("Item", on_delete=models.CASCADE, related_name="stats")
    key = models.CharField(max_length=128, default="")
    value = models.FloatField()

    class Meta:
        unique_together = ("item", "key")


class ItemTag(models.Model):
    items = models.ManyToManyField("Item", related_name="tags")
    name = models.CharField(max_length=128, default="", unique=True)


class ItemRune(models.Model):
    item = models.OneToOneField("Item", related_name="rune", on_delete=models.CASCADE)
    is_rune = models.BooleanField(default=False)
    tier = models.IntegerField()
    _type = models.CharField(max_length=128, default="", blank=True)


def get_item_with_default(li, index, default_val=None):
    try:
        return li[index]
    except ValueError:
        return default_val


class ProfileIcon(VersionedModel):
    _id = models.IntegerField(db_index=True)
    version = models.CharField(max_length=128, default="", blank=True, db_index=True)
    language = models.CharField(max_length=128, default="", blank=True, db_index=True)
    full = models.CharField(max_length=128, default="", blank=True)
    group = models.CharField(max_length=128, default="", blank=True)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128, default="", blank=True)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    class Meta:
        unique_together = ("_id", "version", "language")

    def __str__(self):
        return f'ProfileIcon(_id={self._id}, version="{self.version}", language="{self.language}")'

    def image_url(self):
        return f"https://ddragon.leagueoflegends.com/cdn/{self.version}/img/profileicon/{self.full}"


class Champion(VersionedModel):
    _id = models.CharField(max_length=128, default="", blank=True, db_index=True)
    version = models.CharField(max_length=128, default="", blank=True, db_index=True)
    language = models.CharField(max_length=128, default="", blank=True, db_index=True)
    key = models.IntegerField(db_index=True)
    name = models.CharField(max_length=128, default="", blank=True)
    partype = models.CharField(max_length=128, default="", blank=True)
    title = models.CharField(max_length=128, default="", blank=True)
    lore = models.CharField(max_length=2048, default="", blank=True)
    last_changed = models.CharField(max_length=16, default=None, null=True, blank=True)

    created_date = models.DateTimeField(default=timezone.now)

    image: Union['ChampionImage', None]
    stats: Union['ChampionStats', None]
    spells: models.QuerySet['ChampionSpell']

    class Meta:
        unique_together = ("_id", "version", "language")

    def __str__(self):
        return f'Champion(_id="{self._id}", version="{self.version}", language="{self.language}")'

    def get_newest_version(self):
        query = Champion.objects.order_by("-major", "-minor", "-patch")
        if champ := query.first():
            return champ.version
        return None

    def image_url(self):
        return self.image.image_url() if self.image else ''

    def is_diff(self, other: Self):
        """Check to see if a champion has differences with another.
        """
        spell_attrs = [
            "cooldown_burn",
            "cost_burn",
            "cost_type",
            "description",
            "max_ammo",
            "max_rank",
            "range_burn",
            "resource",
            "tooltip",
        ]
        assert self.stats and other.stats
        stat_diffs = {
            "armor": self.stats.armor == other.stats.armor,
            "armor_per_level": self.stats.armor_per_level
            == other.stats.armor_per_level,
            "attack_damage": self.stats.attack_damage == other.stats.attack_damage,
            "attack_damage_per_level": self.stats.attack_damage_per_level
            == other.stats.attack_damage_per_level,
            "attack_range": self.stats.attack_range == other.stats.attack_range,
            "attack_speed": self.stats.attack_speed == other.stats.attack_speed,
            "attack_speed_per_level": self.stats.attack_speed_per_level
            == other.stats.attack_speed_per_level,
            "crit": self.stats.crit == other.stats.crit,
            "crit_per_level": self.stats.crit_per_level == other.stats.crit_per_level,
            "hp": self.stats.hp == other.stats.hp,
            "hp_per_level": self.stats.hp_per_level == other.stats.hp_per_level,
            "hp_regen": self.stats.hp_regen == other.stats.hp_regen,
            "hp_regen_per_level": self.stats.hp_regen_per_level
            == other.stats.hp_regen_per_level,
            "move_speed": self.stats.move_speed == other.stats.move_speed,
            "mp": self.stats.mp == other.stats.mp,
            "mp_per_level": self.stats.mp_per_level == other.stats.mp_per_level,
            "mp_regen": self.stats.mp_regen == other.stats.mp_regen,
            "mp_regen_per_level": self.stats.mp_regen_per_level
            == other.stats.mp_regen_per_level,
            "spell_block": self.stats.spell_block == other.stats.spell_block,
            "spell_block_per_level": self.stats.spell_block_per_level
            == other.stats.spell_block_per_level,
        }
        selfspells = self.spells.all()
        otherspells = other.spells.all()
        all_names = set(x.name for x in selfspells) | set(x.name for x in otherspells)
        all_names = sorted(list(all_names))
        spell_diffs = {}
        for name in all_names:
            query0 = selfspells.filter(name=name)
            query1 = otherspells.filter(name=name)
            if query0.exists() and query1.exists():
                spell0 = query0[:1].get()
                spell1 = query1[:1].get()
                spell_diffs[name] = all(
                    getattr(spell0, attr) == getattr(spell1, attr)
                    for attr in spell_attrs
                )
            else:
                spell_diffs[name] = False
        if all(stat_diffs.values()) and all(spell_diffs.values()):
            out = False
        else:
            out = {"general": stat_diffs, "spells": spell_diffs}
        return out


class ChampionImage(ThumbnailedModel):
    champion = models.OneToOneField(
        "Champion", on_delete=models.CASCADE, related_name="image"
    )
    full = models.CharField(max_length=128, default="", blank=True)
    group = models.CharField(max_length=128, default="", blank=True)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128, default="", blank=True)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __str__(self):
        return f'ChampionImage(champion="{self.champion._id}")'

    def image_url(self):
        return f"https://ddragon.leagueoflegends.com/cdn/{self.champion.version}/img/champion/{self.full}"

    def splash_url(self, skin=0):
        return f"https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{self.champion._id}_{skin}.jpg"

    def loading_art_url(self, skin=0):
        return f"https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{self.champion._id}_{skin}.jpg"


class ChampionInfo(models.Model):
    champion = models.OneToOneField(
        "Champion", on_delete=models.CASCADE, related_name="info"
    )
    attack = models.IntegerField()
    defense = models.IntegerField()
    difficulty = models.IntegerField()
    magic = models.IntegerField()

    def __str__(self):
        return f'ChampionInfo(champion="{self.champion._id}")'


class ChampionStats(models.Model):
    champion = models.OneToOneField(
        "Champion", on_delete=models.CASCADE, related_name="stats"
    )
    armor = models.FloatField()
    armor_per_level = models.FloatField()
    attack_damage = models.FloatField()
    attack_damage_per_level = models.FloatField()
    attack_range = models.FloatField()
    attack_speed = models.FloatField(null=True)
    attack_speed_per_level = models.FloatField(null=True)
    crit = models.FloatField()
    crit_per_level = models.FloatField()
    hp = models.FloatField()
    hp_per_level = models.FloatField()
    hp_regen = models.FloatField()
    hp_regen_per_level = models.FloatField()
    move_speed = models.FloatField()
    mp = models.FloatField()
    mp_per_level = models.FloatField()
    mp_regen = models.FloatField()
    mp_regen_per_level = models.FloatField()
    spell_block = models.FloatField()
    spell_block_per_level = models.FloatField()

    def __str__(self):
        return f"ChampionStats(champion={self.champion.name}, version={self.champion.version}, language={self.champion.language})"


class ChampionTag(models.Model):
    champions = models.ManyToManyField("Champion", related_name="tags")
    name = models.CharField(max_length=128, default="", unique=True)

    def __str__(self):
        return f"ChampionTag(name={self.name})"


class ChampionPassive(models.Model):
    champion = models.OneToOneField(
        "Champion", on_delete=models.CASCADE, related_name="passive"
    )
    description = models.CharField(max_length=1024, default="", blank=True)
    name = models.CharField(max_length=128, default="", blank=True)

    image: Union['ChampionPassiveImage', None]

    def __str__(self):
        return f'ChampionPassive(champion="{self.champion._id}", name="{self.name}", version="{self.champion.version}", language="{self.champion.language}")'

    def image_url(self):
        return self.image.image_url() if self.image else ''


class ChampionPassiveImage(models.Model):
    passive = models.OneToOneField(
        "ChampionPassive", on_delete=models.CASCADE, related_name="image"
    )
    full = models.CharField(max_length=128, default="", blank=True)
    group = models.CharField(max_length=128, default="", blank=True)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128, default="", blank=True)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __str__(self):
        return f'ChampionPassiveImage(passive="{self.passive.name}", version="{self.passive.champion.version}", language="{self.passive.champion.language}")'

    def image_url(self):
        return f"https://ddragon.leagueoflegends.com/cdn/{self.passive.champion.version}/img/passive/{self.full}"


class ChampionSkin(models.Model):
    champion = models.ForeignKey(
        "Champion", related_name="skins", on_delete=models.CASCADE
    )
    _id = models.IntegerField()
    chromas = models.BooleanField(default=False)
    name = models.CharField(max_length=128, default="", blank=True)
    num = models.IntegerField()

    class Meta:
        unique_together = ("champion", "_id")

    def __str__(self):
        return f'ChampionSkin(champion="{self.champion._id}", _id={self._id}, num={self.num}, version="{self.champion.version}", language="{self.champion.language}")'

    def splash_url(self):
        try:
            return self.champion.image.splash_url(skin=self.num)
        except:
            return ""

    def loading_art_url(self):
        try:
            return self.champion.image.loading_art_url(skin=self.num)
        except:
            return ""


class ChampionSpell(models.Model):
    champion = models.ForeignKey(
        "Champion", on_delete=models.CASCADE, related_name="spells"
    )
    _id = models.CharField(max_length=128, default="", blank=True)
    cooldown_burn = models.CharField(max_length=128, default="", blank=True)
    cost_burn = models.CharField(max_length=128, default="", blank=True)
    cost_type = models.CharField(max_length=128, default="", blank=True)
    # data_values
    description = models.CharField(max_length=1024, default="", blank=True)
    max_ammo = models.CharField(max_length=128, default="", blank=True)
    max_rank = models.IntegerField()
    name = models.CharField(max_length=128, default="", blank=True)
    range_burn = models.CharField(max_length=128, default="", blank=True)
    resource = models.CharField(max_length=128, default="", blank=True)
    tooltip = models.CharField(max_length=2048, default="", blank=True)

    effect_burn: models.QuerySet['ChampionEffectBurn']
    image: Union['ChampionSpellImage', None]

    class Meta:
        unique_together = ("champion", "_id")

    def __str__(self):
        return f'ChampionSpell(champion="{self.champion._id}", _id="{self._id}")'

    def get_effect(self):
        """Get the effect list, in ascending order.
        """
        query = self.effect_burn.all()
        out = [x for x in query]
        out.sort(key=lambda x: x.sort_int)
        out = [x.value for x in out]
        return out

    def image_url(self):
        return self.image.image_url() if self.image else ''


class ChampionSpellImage(models.Model):
    spell = models.OneToOneField(
        "ChampionSpell", on_delete=models.CASCADE, related_name="image"
    )
    full = models.CharField(max_length=256, default="", blank=True)
    group = models.CharField(max_length=128, default="", blank=True)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128, default="", blank=True)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __str__(self):
        return f'ChampionSpellImage(champion="{self.spell.champion._id}", spell="{self.spell._id}")'

    def image_url(self):
        return f"https://ddragon.leagueoflegends.com/cdn/{self.spell.champion.version}/img/spell/{self.full}"


class ChampionEffectBurn(models.Model):
    spell = models.ForeignKey(
        "ChampionSpell", on_delete=models.CASCADE, related_name="effect_burn"
    )
    sort_int = models.IntegerField()
    value = models.CharField(max_length=128, default=None, null=True, blank=True)

    class Meta:
        unique_together = ("spell", "sort_int")

    def __str__(self):
        return f'ChampionEffectBurn(champion="{self.spell.champion._id}", spell="{self.spell._id}")'


class ChampionSpellVar(models.Model):
    spell = models.ForeignKey(
        "ChampionSpell", on_delete=models.CASCADE, related_name="vars"
    )
    coeff = models.CharField(max_length=256, default="", blank=True)
    key = models.CharField(max_length=32, default="", blank=True)
    link = models.CharField(max_length=128, default="", blank=True)
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ("spell", "sort_int")

    def __str__(self):
        return f'ChampionSpellVar(spell="{self.spell._id}", key="{self.key}")'


class SummonerSpell(VersionedModel):
    _id = models.CharField(max_length=128, default="", blank=True, db_index=True)
    key = models.IntegerField(db_index=True)
    version = models.CharField(max_length=128, db_index=True)
    language = models.CharField(max_length=128, db_index=True)
    cooldown_burn = models.CharField(max_length=128, default="", blank=True)
    cost_burn = models.CharField(max_length=128, default="", blank=True)
    cost_type = models.CharField(max_length=128, default="", blank=True)
    description = models.CharField(max_length=2048, default="", blank=True)
    max_ammo = models.CharField(max_length=128, default="", blank=True)
    max_rank = models.IntegerField()
    name = models.CharField(max_length=128, default="", blank=True)
    range_burn = models.CharField(max_length=256, default="", blank=True)
    resource = models.CharField(max_length=128, default="", blank=True, null=True)
    summoner_level = models.IntegerField()
    tooltip = models.TextField(max_length=2048, default="", blank=True)

    image: Union['SummonerSpellImage', None]

    class Meta:
        unique_together = ("key", "version", "language")

    def __str__(self):
        return f'SummonerSpell(_id="{self._id}", version="{self.version}", language="{self.language}")'

    def image_url(self):
        return self.image.image_url() if self.image else ''


class SummonerSpellEffectBurn(models.Model):
    spell = models.ForeignKey(
        "SummonerSpell", on_delete=models.CASCADE, related_name="effect_burn"
    )
    value = models.CharField(max_length=32, default="", blank=True, null=True)
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ("spell", "sort_int")

    def __str__(self):
        return f'SummonerSpellEffectBurn(spell="{self.spell._id}", sort_int={self.sort_int})'


class SummonerSpellImage(models.Model):
    spell = models.OneToOneField(
        "SummonerSpell", on_delete=models.CASCADE, related_name="image"
    )
    full = models.CharField(max_length=256, default="", blank=True)
    group = models.CharField(max_length=128, default="", blank=True)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128, default="", blank=True)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __str__(self):
        return f'SummonerSpellImage(spell="{self.spell._id}")'

    def image_url(self):
        return f"https://ddragon.leagueoflegends.com/cdn/{self.spell.version}/img/spell/{self.full}"


class SummonerSpellMode(models.Model):
    spell = models.ForeignKey(
        "SummonerSpell", on_delete=models.CASCADE, related_name="modes"
    )
    name = models.CharField(max_length=128, default="", blank=True)
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ("spell", "name")

    def __str__(self):
        return f'SummonerSpellMode(spell="{self.spell._id}", name="{self.name}")'


class SummonerSpellVar(models.Model):
    spell = models.ForeignKey(
        "SummonerSpell", on_delete=models.CASCADE, related_name="vars"
    )
    coeff = models.CharField(max_length=1024, default="", blank=True)
    key = models.CharField(max_length=128, default="", blank=True)
    link = models.CharField(max_length=128, default="", blank=True)
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ("spell", "sort_int")

    def __str__(self):
        return f'SummonerSpellVar(spell="{self.spell._id}", key="{self.key}", sort_int={self.sort_int})'
