"""player/tests/test_models.py

Tests for player models.

"""
# STANDARD LIBRARY
from unittest.mock import Mock

# 3RD PARTY
from model_mommy import mommy

# STANDARD DJANGO
from django.test import TestCase
from django.utils import timezone

# LOCAL DJANGO
from player.models import simplify, NameChange


class TestSimplify(TestCase):

    def test_many_names(self):
        names = (
            ('bob', 'bob'),
            ('BOB', 'bob'),
            ('Yo its Bob', 'yoitsbob'),
            ('Import Antigrvty', 'importantigrvty'),
            ('abcd1234ABCD', 'abcd1234abcd')
        )
        for name in names:
            self.assertEqual(simplify(name[0]), name[1])


class SummonerTest(TestCase):

    def test_save(self):
        summoner = mommy.make(
            'player.Summoner',
            name='',
        )
        self.assertEqual(summoner.name, '')

    def test_str(self):
        summoner = mommy.make(
            'player.Summoner',
            name='hello world',
            region='na',
        )
        self.assertEqual(
            summoner.__str__(),
            'Summoner(name="hello world", region=na)'
        )

    def test_name_change_creation_on_save(self):
        namechange_count = NameChange.objects.all().count()
        self.assertEqual(namechange_count, 0)

        summoner = mommy.make(
            'player.Summoner',
            name='name numbah 1',
        )
        summoner.name = 'name numbah 2'
        summoner.save()

        namechange_count = NameChange.objects.all().count()
        self.assertEqual(namechange_count, 1)

    def test_get_newest_rank_checkpoint(self):
        summoner = mommy.make('player.Summoner')

        self.assertEqual(summoner.get_newest_rank_checkpoint(), None)

        old_rank_checkpoint = mommy.make(
            'player.RankCheckpoint',
            summoner=summoner,
            created_date=timezone.now() - timezone.timedelta(days=300),
        )
        self.assertEqual(summoner.get_newest_rank_checkpoint(), old_rank_checkpoint)

        new_rank_checkpoint = mommy.make(
            'player.RankCheckpoint',
            summoner=summoner,
            created_date=timezone.now(),
        )
        self.assertEqual(summoner.get_newest_rank_checkpoint(), new_rank_checkpoint)


class NameChangeTest(TestCase):

    def test_str(self):
        namechange = mommy.make(
            'player.NameChange',
            old_name='oldboy',
            summoner=mommy.make(
                'player.Summoner',
                name='newboy',
            ),
        )
        self.assertEqual(
            namechange.__str__(),
            'NameChange(old_name="oldboy", new_name="newboy")'
        )


class CustomTest(TestCase):

    def test_save(self):
        before = timezone.now()
        custom = mommy.make('player.Custom')
        after = timezone.now()
        self.assertGreater(custom.modified_date, before)
        self.assertGreater(after, custom.modified_date)

