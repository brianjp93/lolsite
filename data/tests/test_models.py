"""data/tests/test_models.py

Tests for data.models

"""
from model_mommy import mommy
from hypothesis.extra.django import TestCase, from_model
from hypothesis.strategies import text
from hypothesis import given

from data.models import Rito


class RitoTest(TestCase):
    pass
    # @given(token=text())
    # def test_str(self, token):
    #     rito = from_model(Rito, token=token)
    #     self.assertEqual(rito.__str__(), f'Rito(token="{token}")')


class QueueTest(TestCase):
    def test_str(self):
        queue = mommy.make("data.Queue", _id=10, _map="test_rift",)
        self.assertEqual(queue.__str__(), 'Queue(_id=10, _map="test_rift")')

    def test_get_map(self):
        queue = mommy.make("data.Queue", _map="test rift",)
        self.assertEqual(queue.get_map(), None)

        map_model = mommy.make("data.Map", name="test rift",)
        self.assertEqual(queue.get_map(), map_model)


class SeasonTest(TestCase):
    def test_str(self):
        season = mommy.make("data.Season", _id=10, name="test season")
        self.assertEqual(season.__str__(), 'Season(_id=10, name="test season")')


class MapTest(TestCase):
    def test_str(self):
        map_model = mommy.make("data.Map", name="test map")
        self.assertEqual(map_model.__str__(), 'Map(name="test map")')

    def test_minimap_url(self):
        map_model = mommy.make("data.Map", _id=10)
        self.assertEqual(
            map_model.minimap_url(),
            "https://ddragon.leagueoflegends.com/cdn/9.5.1/img/map/map10.png",
        )

        item = mommy.make("data.Item", version="9.6.1")
        item_old = mommy.make("data.Item", version="9.3.1")
        self.assertEqual(
            map_model.minimap_url(),
            "https://ddragon.leagueoflegends.com/cdn/9.6.1/img/map/map10.png",
        )
        self.assertEqual(
            map_model.minimap_url(version="9.7.1"),
            "https://ddragon.leagueoflegends.com/cdn/9.7.1/img/map/map10.png",
        )


class ProfileIconTest(TestCase):
    def test_version_parse(self):
        versions = [
            ("10.10.1", (10, 10, 1)),
            ("9.9.10", (9, 9, 10)),
            ("11.12.2", (11, 12, 2)),
            ("15.3.4", (15, 3, 4)),
        ]
        for ver, parts in versions:
            pi = mommy.make("data.ProfileIcon", version=ver)
            self.assertEqual((pi.major, pi.minor, pi.patch), parts)
        with self.assertRaises(ValueError):
            pi = mommy.make("data.ProfileIcon", version="10.10.14ab")
