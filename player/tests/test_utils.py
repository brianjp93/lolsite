"""player/tests/test_utils.py
"""
from django.test import TestCase
from player import utils
from player.tests.factories import UserFactory


class GeneralTests(TestCase):
    def test_get_admin(self):
        UserFactory(is_superuser=False)
        user = utils.get_admin()
        self.assertEqual(user, None)
        UserFactory(is_superuser=True)
        user = utils.get_admin()
        self.assertTrue(user.is_superuser)
