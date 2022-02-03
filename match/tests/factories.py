from match.models import Match, Participant
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory
import random

import factory

User = get_user_model()


class ParticipantFactory(DjangoModelFactory):
    class Meta:
        model = Participant

    _id = factory.Sequence(lambda n: n)
    champion_id = 10
    summoner_1_id = 1
    summoner_2_id = 2
    team_id = 100
    puuid = factory.Faker('uuid4')
    summoner_name = factory.Faker('name')


class MatchFactory(DjangoModelFactory):
    class Meta:
        model = Match

    _id = factory.Faker('text', max_nb_chars=16)
    major = 10
    minor = 1
    patch = 10
    game_creation = factory.lazy_attribute(lambda o: random.random() * 100000)
    game_duration = factory.lazy_attribute(lambda o: random.random() * 1000)
    game_mode = 'blah'
    game_type = 'idk'
    map_id = 10

    platform_id = 'platform'
    queue_id = 420
    season_id = 10
    game_version = '10.1.10.1'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        kwargs['build'] = 1
        return super()._create(model_class, *args, **kwargs)

    @factory.post_generation
    def participants(self, create, extracted, **kwargs):
        if extracted:
            for _ in range(extracted):
                ParticipantFactory(match=self)
