import logging

from player.filters import SummonerAutocompleteFilter

logger = logging.getLogger(__name__)


def search_form(request):
    return {"search_form": SummonerAutocompleteFilter()}


def favorites_list(request):
    if request.user.is_authenticated:
        return {
            "favorites_list": [
                x.summoner
                for x in request.user.favorite_set.all()
                .select_related("summoner")
                .order_by("sort_int")
            ]
        }
    return []
