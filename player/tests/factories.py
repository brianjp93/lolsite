from player.models import Reputation, Summoner, Custom, SummonerLink
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory

import factory

User = get_user_model()


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('email',)

    email = factory.Faker('email')
    username = factory.LazyAttribute(lambda o: o.email)
    password = 'password'

    @classmethod
    def _prepare(cls, create, **kwargs):
        password = kwargs.pop('password', None)
        user = super()._prepare(create, **kwargs)
        if password:
            user.set_password(password)
            if create:
                user.save()
        return user


class CustomFactory(DjangoModelFactory):
    class Meta:
        model = Custom
        django_get_or_create = ('user',)

    user = factory.SubFactory(UserFactory)


class SummonerFactory(DjangoModelFactory):
    class Meta:
        model = Summoner

    _id = factory.Faker('uuid4')
    puuid = factory.Sequence(lambda n: f'puuid{n}')
    region = 'na'
    name = factory.Faker('name')


class ReputationFactory(DjangoModelFactory):
    class Meta:
        model = Reputation
        django_get_or_create = ('user', 'summoner')


class SummonerLinkFactory(DjangoModelFactory):
    class Meta:
        model = SummonerLink
        django_get_or_create = ('user', 'summoner')

    user = factory.SubFactory(UserFactory)
    summoner = factory.SubFactory(SummonerFactory)
