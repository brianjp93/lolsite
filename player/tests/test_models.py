"""player/tests/test_models.py

Tests for player models.

"""
from mock import Mock
from model_mommy import mommy 

from django.test import TestCase

from player.models import simplify


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
