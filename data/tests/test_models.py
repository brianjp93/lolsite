"""data/tests/test_models.py

Tests for data.models

"""
from unittest.mock import Mock

from model_mommy import mommy

from django.test import TestCase


class RitoTest(TestCase):

    def test_str(self):
        rito = mommy.make('data.Rito', token='hello world')
        self.assertEqual(rito.__str__(), 'Rito(token="hello world")')


class QueueTest(TestCase):

    def test_str(self):
        queue = mommy.make(
            'data.Queue',
            _id=10,
            _map='test_rift',
        )
        self.assertEqual(
            queue.__str__(),
            'Queue(_id=10, _map="test_rift")'
        )

    def test_get_map(self):
        queue = mommy.make(
            'data.Queue',
            _map='test rift',
        )
        self.assertEqual(queue.get_map(), None)

        map_model = mommy.make(
            'data.Map',
            name='test rift',
        )
        self.assertEqual(queue.get_map(), map_model)


class SeasonTest(TestCase):

    def test_str(self):
        season = mommy.make('data.Season', _id=10, name='test season')
        self.assertEqual(
            season.__str__(),
            'Season(_id=10, name="test season")'
        )
