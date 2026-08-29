import json
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.templatetags.static import static
from django.views import generic

from lolsite.viewsapi import _get_match_meta_data, _get_summoner_meta_data


class FrontendView(generic.TemplateView):
    template_name = "frontend.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
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
            base = settings.REACT_PROXY_URL.rstrip("/")
            context.update(
                react_refresh_url=f"{base}/@react-refresh",
                react_scripts=[f"{base}/@vite/client", f"{base}/src/main.tsx"],
                react_styles=[],
            )
            return context

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
        return context
