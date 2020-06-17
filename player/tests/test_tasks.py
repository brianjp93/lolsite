"""player/tests/test_tasks.py
"""
from unittest.mock import Mock

from model_mommy import mommy

from django.contrib.auth.models import User
from django.test import TestCase

from player.models import Custom
from player import tasks as pt


class SignUpTests(TestCase):
    def test_create_user(self):
        pt.create_account("test@gmail.com", "test-password")
        user = User.objects.get(email="test@gmail.com")
        self.assertEqual(user.email, "test@gmail.com")
        self.assertEqual(user.username, "test@gmail.com")

    def test_email_already_exists(self):
        pt.create_account("test@gmail.com", "test-password")
        user = pt.create_account("test@gmail.com", "another-password")
        self.assertFalse(user)
        self.assertEqual(User.objects.filter(email="test@gmail.com").count(), 1)

    def test_email_case_insensitive_already_exists(self):
        pt.create_account("test@gmail.com", "test-password")
        user = pt.create_account("tEst@gmail.com", "another-password")
        self.assertFalse(user)
        self.assertEqual(User.objects.filter(email="test@gmail.com").count(), 1)

    def test_password_length(self):
        is_valid = pt.is_new_email_valid("test@gmail.com", "abcd")
        self.assertFalse(is_valid)
