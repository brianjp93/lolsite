"""data/tests/test_models.py

Tests for data.models

"""
from hypothesis.extra.django import TestCase

from .factories import QueueFactory, MapFactory


class QueueTest(TestCase):
    def test_str(self):
        queue = QueueFactory()
        self.assertEqual(queue.__str__(), f'Queue(_id={queue._id}, _map="{queue._map}")')

    def test_get_map(self):
        queue = QueueFactory(_map="test rift",)
        self.assertEqual(queue.get_map(), None)

        map_model = MapFactory(name="test rift")
        self.assertEqual(queue.get_map(), map_model)
