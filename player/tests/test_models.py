# STANDARD DJANGO
from django.test import TestCase
from django.utils import timezone

# LOCAL DJANGO
from player.models import simplify
from .factories import SummonerFactory, RankCheckpointFactory


class TestSimplify(TestCase):
    def test_many_names(self):
        names = (
            ("bob", "bob"),
            ("BOB", "bob"),
            ("Yo its Bob", "yoitsbob"),
            ("Import Antigrvty", "importantigrvty"),
            ("abcd1234ABCD", "abcd1234abcd"),
        )
        for name in names:
            self.assertEqual(simplify(name[0]), name[1])


class SummonerTest(TestCase):
    def test_get_newest_rank_checkpoint(self):
        summoner = SummonerFactory()

        self.assertEqual(summoner.get_newest_rank_checkpoint(), None)

        old_rank_checkpoint = RankCheckpointFactory(
            summoner=summoner,
            created_date=timezone.now() - timezone.timedelta(days=300),
        )
        self.assertEqual(summoner.get_newest_rank_checkpoint(), old_rank_checkpoint)

        new_rank_checkpoint = RankCheckpointFactory(
            summoner=summoner,
            created_date=timezone.now(),
        )
        self.assertEqual(summoner.get_newest_rank_checkpoint(), new_rank_checkpoint)
