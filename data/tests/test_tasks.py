"""data/tests/test_tasks.py

Tests for the tasks.py file.

"""
from django.test import TestCase

from data.models import Map, Queue, GameMode
from data.models import GameType

from data import tasks
from data import constants as DATA_CONSTANTS


class TestImportMaps(TestCase):
    def setUp(self):
        tasks.import_maps()

    def test_imported(self):
        count = Map.objects.all().count()
        true_count = len(DATA_CONSTANTS.MAPS)
        self.assertEqual(count, true_count)


class TestImportQueues(TestCase):
    def setUp(self):
        tasks.import_queues()

    def test_imported(self):
        count = Queue.objects.all().count()
        true_count = len(DATA_CONSTANTS.QUEUES)
        self.assertEqual(count, true_count)


class TestImportGameModes(TestCase):
    def setUp(self):
        tasks.import_gamemodes()

    def test_imported(self):
        count = GameMode.objects.all().count()
        true_count = len(DATA_CONSTANTS.GAMEMODES)
        self.assertEqual(count, true_count)


class TestImportGameTypes(TestCase):
    def setUp(self):
        tasks.import_gametypes()

    def test_imported(self):
        count = GameType.objects.all().count()
        true_count = len(DATA_CONSTANTS.GAMETYPES)
        self.assertEqual(count, true_count)
