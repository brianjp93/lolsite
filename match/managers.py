from typing import TYPE_CHECKING

from django.db import models

from data.models import Champion, ReforgedRune, ReforgedTree, Item, CDSummonerSpell

if TYPE_CHECKING:
    from match.models import Match


class MatchQuerySet(models.QuerySet["Match"]):
    @property
    def version(self):
        if len(self) == 0:
            return None, None
        return self[0].major, self[0].minor

    def get_items(self, puuid=None):
        from match.models import Stats
        major, minor = self.version
        item_ids = set()
        qs = Stats.objects.filter(participant__match__in=self)
        if puuid is not None:
            qs = qs.filter(participant__puuid=puuid)
        for stat in qs:
            for i in range(7):
                key = f"item_{i}"
                item_id = getattr(stat, key)
                item_ids.add(item_id)
        qs = Item.objects.filter(_id__in=item_ids, major=major, minor=minor).select_related('image')
        if not len(qs):
            # backup
            qs = Item.objects.filter(_id__in=item_ids)
            qs = qs.order_by("_id", "-major", "-minor")
            qs = qs.distinct("_id").select_related("image")
        return {x._id: x for x in qs}

    def get_spell_images(self):
        major, minor = self.version
        spell_ids = set()
        for match in self:
            for part in match.participants.all():
                spell_ids.add(part.summoner_1_id)
                spell_ids.add(part.summoner_2_id)
        qs = (
            CDSummonerSpell.objects.filter(
                ext_id__in=spell_ids,
                major=major,
                minor=minor
            )
        )
        if not len(qs):
            # backup
            qs = (
                CDSummonerSpell.objects.filter(
                    ext_id__in=spell_ids,
                )
                .order_by(
                    "ext_id",
                    "-major",
                    "-minor",
                )
                .distinct(
                    "ext_id",
                )
            )
        return {x.ext_id: x.image_url() for x in qs}

    def get_spells(self):
        major, minor = self.version
        spell_ids = set()
        for match in self:
            for part in match.participants.all():
                spell_ids.add(part.summoner_1_id)
                spell_ids.add(part.summoner_2_id)
        qs = (
            CDSummonerSpell.objects.filter(
                ext_id__in=spell_ids,
                major=major,
                minor=minor,
            )
        )
        if not len(qs):
            qs = (
                CDSummonerSpell.objects.filter(
                    ext_id__in=spell_ids,
                )
                .order_by(
                    "ext_id",
                    "-major",
                    "-minor",
                )
                .distinct(
                    "ext_id",
                )
            )
        return {x.ext_id: x for x in qs}

    def get_perk_substyles(self):
        major, minor = self.version
        substyles = set()
        for match in self:
            for part in match.participants.all():
                assert part.stats
                substyles.add(part.stats.perk_sub_style)
        qs = ReforgedTree.objects.filter(_id__in=substyles, major=major, minor=minor)
        if not len(qs):
            qs = ReforgedTree.objects.filter(_id__in=substyles)
            qs = qs.order_by("_id", "-major", "-minor").distinct("_id")
        return {x._id: x.image_url() for x in qs}

    def get_substyles(self):
        major, minor = self.version
        substyles = set()
        for match in self:
            for part in match.participants.all():
                assert part.stats
                substyles.add(part.stats.perk_sub_style)
        qs = ReforgedTree.objects.filter(_id__in=substyles, major=major, minor=minor)
        if not len(qs):
            qs = ReforgedTree.objects.filter(_id__in=substyles)
            qs = qs.order_by("_id", "-major", "-minor").distinct("_id")
        return {x._id: x for x in qs}

    def get_runes(self):
        major, minor = self.version
        all_runes = set()
        for match in self:
            for part in match.participants.all():
                for _i in range(6):
                    all_runes.add(getattr(part.stats, f"perk_{_i}"))
        rune_data = (
            ReforgedRune.objects.filter(
                _id__in=all_runes,
                reforgedtree__major=major,
                reforgedtree__minor=minor,
            )
        )
        if not len(rune_data):
            rune_data = (
                ReforgedRune.objects.filter(
                    _id__in=all_runes,
                )
                .order_by("_id", "-reforgedtree__major", "reforgedtree__minor")
                .distinct("_id")
            )
        return {x._id: x for x in rune_data}

    def get_champions(self):
        if not len(self):
            return {}
        all_champions = {part.champion_id for match in self for part in match.participants.all()}

        for match in self:
            for team in match.teams.all():
                for ban in team.bans.all():
                    all_champions.add(ban.champion_id)
        major, minor = self[0].major, self[0].minor
        qs = (
            Champion.objects.filter(
                key__in=all_champions,
                major=major,
                minor=minor,
            )
            .select_related("image")
            .order_by("key", "-major", "-minor")
            .distinct()
        )
        if not len(qs):
            # backup query
            qs = (
                Champion.objects.filter(
                    key__in=all_champions,
                )
                .select_related("image")
                .order_by("key", "-major", "-minor")
                .distinct()
            )
        return {x.key: x for x in qs}

    def get_related(self):
        return {
            "items": self.get_items(),
            "runes": self.get_runes(),
            "perk_substyles": self.get_perk_substyles(),
            "substyles": self.get_substyles(),
            "spell_images": self.get_spell_images(),
            "spells": self.get_spells(),
            "champions": self.get_champions(),
        }


class MatchManager(models.Manager['Match']):
    def get_queryset(self):
        return MatchQuerySet(self.model, using=self._db)

    def filter(self, *args, **kwargs) -> MatchQuerySet:
        return super().filter(*args, **kwargs)  # type: ignore

    def all(self) -> MatchQuerySet:
        return super().all()  # type: ignore
