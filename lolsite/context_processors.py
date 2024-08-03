import logging

from player.filters import SummonerAutocompleteFilter

logger = logging.getLogger(__name__)


def search_form(request):
    return {'search_form': SummonerAutocompleteFilter()}
