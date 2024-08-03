from django.core.management.base import BaseCommand
from match.serializers import LlmMatchSerializer


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("match_id", type=str)

    def handle(self, *args, **options):
        match_id = options['match_id']
        match = LlmMatchSerializer.Meta.model.objects.get(_id=match_id)
        return str(LlmMatchSerializer(match, many=False).data)
