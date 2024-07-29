import logging

from player.forms import SummonerSearchForm

logger = logging.getLogger(__name__)


def search_form(request):
    return {'search_form': SummonerSearchForm()}
