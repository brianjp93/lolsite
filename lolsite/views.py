import json
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.templatetags.static import static
from django.views import generic

from data.constants import QUEUES
from data.serializers import BasicChampionWithImageSerializer
from data.viewsapi import BasicChampionView
from lolsite.viewsapi import _get_match_meta_data, _get_summoner_meta_data
from match.viewsapi import MajorPatchView
from player.models import Favorite, Summoner
from player.serializers import FavoriteSerializer, SummonerSerializer, UserSerializer


def _get_common_initial_data():
    return {
        "queues": QUEUES,
        "majorPatches": MajorPatchView().get_data(),
        "basicChampions": BasicChampionWithImageSerializer(
            BasicChampionView().get_queryset(), many=True
        ).data,
    }


class FrontendView(generic.TemplateView):
    template_name = "frontend.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context["initial_data"] = {
            **_get_common_initial_data(),
            **(
                {
                    "me": UserSerializer(user).data,
                    "following": SummonerSerializer(
                        Summoner.objects.filter(follow__user=user).with_profile_icon(),
                        many=True,
                    ).data,
                    "favorites": FavoriteSerializer(
                        Favorite.objects.filter(user=user)
                        .select_related("summoner")
                        .order_by("sort_int"),
                        many=True,
                    ).data,
                }
                if user.is_authenticated
                else {"me": None, "following": [], "favorites": []}
            ),
        }
        resolver_match = self.request.resolver_match
        if resolver_match:
            match resolver_match.url_name:
                case "summoner-page":
                    riot_id_name, riot_id_tagline = kwargs["riot_id"]
                    context.update(
                        _get_summoner_meta_data(
                            riot_id_name, riot_id_tagline, kwargs["region"]
                        )
                    )
                case "frontend-match-detail":
                    riot_id_name, riot_id_tagline = kwargs["riot_id"]
                    context.update(
                        _get_match_meta_data(
                            riot_id_name,
                            riot_id_tagline,
                            kwargs["region"],
                            kwargs["match_id"],
                        )
                    )

        if settings.REACT_PROXY_URL:
            self.handle_local_dev_context(context)
            return context

        self.handle_build_context(context)
        return context

    def handle_local_dev_context(self, context):
        base = settings.REACT_PROXY_URL.rstrip("/")
        context.update(
            react_refresh_url=f"{base}/@react-refresh",
            react_scripts=[f"{base}/@vite/client", f"{base}/src/main.tsx"],
            react_styles=[],
        )

    def handle_build_context(self, context):
        manifest_path = Path(settings.FRONTEND_MANIFEST_PATH)
        try:
            manifest = json.loads(manifest_path.read_text())
            entry = manifest["index.html"]
        except (OSError, json.JSONDecodeError, KeyError) as error:
            raise ImproperlyConfigured(
                f"Build the frontend before serving Django: {manifest_path}"
            ) from error

        context.update(
            react_scripts=[static(entry["file"])],
            react_styles=[static(path) for path in entry.get("css", [])],
        )
