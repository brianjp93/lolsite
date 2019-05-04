from django.test import TestCase
from unittest import mock

from data.models import Season, Map, Queue, GameMode
from data.models import GameType

from data import tasks
from data import constants as DATA_CONSTANTS



class TestImportSeasons(TestCase):
    def setUp(self):
        tasks.import_seasons()


    def testImported(self):
        count = Season.objects.all().count()
        true_count = len(DATA_CONSTANTS.SEASONS)
        self.assertEqual(count, true_count)


class TestImportMaps(TestCase):
    def setUp(self):
        tasks.import_maps()

    def testImported(self):
        count = Map.objects.all().count()
        true_count = len(DATA_CONSTANTS.MAPS)
        self.assertEqual(count, true_count)


class TestImportQueues(TestCase):
    def setUp(self):
        tasks.import_queues()

    def testImported(self):
        count = Queue.objects.all().count()
        true_count = len(DATA_CONSTANTS.QUEUES)
        self.assertEqual(count, true_count)


class TestImportGameModes(TestCase):
    def setUp(self):
        tasks.import_gamemodes()

    def testImported(self):
        count = GameMode.objects.all().count()
        true_count = len(DATA_CONSTANTS.GAMEMODES)
        self.assertEqual(count, true_count)


class TestImportGameTypes(TestCase):
    def setUp(self):
        tasks.import_gametypes()

    def testImported(self):
        count = GameType.objects.all().count()
        true_count = len(DATA_CONSTANTS.GAMETYPES)
        self.assertEqual(count, true_count)
