import factory


class QueueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'data.Queue'

    _id = factory.Sequence(lambda x: x)
    _map = factory.Sequence(lambda x: f"map {x}")


class MapFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'data.Map'

    _id = factory.Sequence(lambda x: x)
    name = factory.Sequence(lambda x: f'name {x}')
    notes = factory.Sequence(lambda x: f'notes {x}')

