from django.test import TestCase, Client
from django.contrib.auth import get_user_model

from player.models import Summoner
from player.serializers import ReputationSerializer
from model_mommy import mommy


User = get_user_model()


class ReputationSerializerTest(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        # self.user = mommy.make(User)
