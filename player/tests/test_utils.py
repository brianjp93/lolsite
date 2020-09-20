"""player/tests/test_utils.py
"""
from model_mommy import mommy
from django.contrib.auth.models import User
from django.test import TestCase
from player import utils


class GeneralTests(TestCase):
    def test_get_admin(self):
        mommy.make(User, is_superuser=False)
        user = utils.get_admin()
        self.assertEqual(user, None)
        mommy.make(User, is_superuser=True)
        user = utils.get_admin()
        self.assertTrue(user.is_superuser)
