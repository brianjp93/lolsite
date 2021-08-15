from django.core.management.base import BaseCommand
from data.models import Rito


class Command(BaseCommand):
    help = 'Create or update riot api token.'

    def add_arguments(self, parser):
        parser.add_argument('token', type=str)

    def handle(self, *args, **options):
        token = options['token']
        rito = Rito.objects.first()
        if rito:
            rito.token = token
            rito.save()
            print(f'Updated token: {token}')
        else:
            rito = Rito.objects.create(token=token)
            print(f'Created new token: {token}')
