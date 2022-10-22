"""player/tests/test_tasks.py
"""
from django.contrib.auth.models import User
from django.test import TestCase

from player import tasks as pt


class SignUpTests(TestCase):
    def test_create_user(self):
        pt.create_account("test@gmail.com", "test-password")
        user = User.objects.get(email="test@gmail.com")
        self.assertEqual(user.email, "test@gmail.com")
        self.assertEqual(user.username, "test@gmail.com")
        query = user.emailverification_set.all()
        self.assertTrue(query.exists())

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


class GeneralTests(TestCase):
    def test_simplify_email(self):
        cases = [
            ("hello", "hello"),
            ("Brian", "brian"),
            ("HAHAHOHO", "hahahoho"),
            ("JEFf123", "jeff123"),
            ("susan@gmail.Com ", "susan@gmail.com"),
        ]
        for case in cases:
            self.assertEqual(pt.simplify_email(case[0]), case[1])
