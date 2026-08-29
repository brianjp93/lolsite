from django.contrib import admin
from django.urls import path, include, register_converter, re_path
from lolsite import views
from django.conf.urls.static import static
from django.conf import settings


class RegionConverter:
    regex = "na|eune|euw|jp|kr|lan|las|br|oce|tr|ru"

    def to_python(self, value: str) -> str:
        return value

    def to_url(self, value: str) -> str:
        return value


class RiotIDConverter:
    regex = r"[^/-]+-[^/]+"

    def to_python(self, value: str) -> tuple[str, str]:
        riot_id_name, riot_id_tagline = value.split("-", 1)
        return riot_id_name, riot_id_tagline

    def to_url(self, value: tuple[str, str]) -> str:
        return "-".join(value)


register_converter(RegionConverter, "region")
register_converter(RiotIDConverter, "riot_id")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("lolsite.urlsapi")),
    path("activity/", include("activity.urls", namespace="activity")),
    path("", views.FrontendView.as_view(), name="home"),
    path(
        "<region:region>/<riot_id:riot_id>",
        views.FrontendView.as_view(),
        name="summoner-page",
    ),
    path(
        "<region:region>/<riot_id:riot_id>/<slug:match_id>",
        views.FrontendView.as_view(),
        name="frontend-match-detail",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
        *urlpatterns,
    ]

urlpatterns += [re_path(".*", views.FrontendView.as_view())]
