import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from lolsite.views import FrontendView


@override_settings(ALLOWED_HOSTS=["testserver"])
class FrontendViewTests(SimpleTestCase):
    def setUp(self):
        self.common_initial_data = {
            "queues": [],
            "majorPatches": {"results": []},
            "basicChampions": [],
        }
        common_data = patch(
            "lolsite.views._get_common_initial_data",
            return_value=self.common_initial_data,
        )
        common_data.start()
        self.addCleanup(common_data.stop)

    @override_settings(REACT_PROXY_URL="http://localhost:3000")
    def test_development_uses_vite_server(self):
        response = self.client.get("/")

        self.assertContains(response, "http://localhost:3000/@react-refresh")
        self.assertContains(response, "__vite_plugin_react_preamble_installed__")
        self.assertContains(response, "http://localhost:3000/@vite/client")
        self.assertContains(response, "http://localhost:3000/src/main.tsx")
        self.assertContains(
            response,
            '<script id="initial-data" type="application/json">'
            '{"queues": [], "majorPatches": {"results": []}, '
            '"basicChampions": [], "me": null, "following": [], '
            '"favorites": []}</script>',
        )

    @override_settings(REACT_PROXY_URL="http://localhost:3000")
    @patch("lolsite.views.FavoriteSerializer")
    @patch("lolsite.views.SummonerSerializer")
    @patch("lolsite.views.UserSerializer")
    @patch("lolsite.views.Favorite.objects.filter")
    @patch("lolsite.views.Summoner.objects.filter")
    def test_initial_data_for_authenticated_user(
        self,
        filter_summoners,
        filter_favorites,
        user_serializer,
        summoner_serializer,
        favorite_serializer,
    ):
        user = Mock(is_authenticated=True)
        user_serializer.return_value.data = {"email": "user@example.com"}
        summoner_serializer.return_value.data = [{"id": 1}]
        favorite_serializer.return_value.data = [{"summoner_id": 2}]
        view = FrontendView()
        view.request = Mock(user=user, resolver_match=None)

        context = view.get_context_data()

        self.assertEqual(
            context["initial_data"],
            {
                **self.common_initial_data,
                "me": {"email": "user@example.com"},
                "following": [{"id": 1}],
                "favorites": [{"summoner_id": 2}],
            },
        )
        filter_summoners.assert_called_once_with(follow__user=user)
        filter_favorites.assert_called_once_with(user=user)

    def test_production_uses_vite_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = Path(directory, "manifest.json")
            manifest.write_text(
                json.dumps(
                    {
                        "index.html": {
                            "file": "assets/app.js",
                            "css": ["assets/app.css"],
                        }
                    }
                )
            )
            with override_settings(REACT_PROXY_URL="", FRONTEND_MANIFEST_PATH=manifest):
                response = self.client.get("/")

        self.assertContains(response, "/static/assets/app.js")
        self.assertContains(response, "/static/assets/app.css")
        self.assertContains(response, 'window.STATIC_PREFIX = "/static/"')
        self.assertNotContains(response, "@react-refresh")

    @override_settings(REACT_PROXY_URL="http://localhost:3000")
    @patch("lolsite.views._get_summoner_meta_data")
    def test_summoner_page_includes_metadata(self, get_metadata):
        get_metadata.return_value = {
            "type": "profile",
            "title": "Summoner metadata",
            "url": "https://hardstuck.club/na/name-tag",
            "image": "https://hardstuck.club/profile.png",
            "description": "Summoner description",
        }

        cases = {
            "/na/C9%20ThunderCats-NA1": ("C9 ThunderCats", "NA1", "na"),
            "/na/LS%20%E3%83%AB%E3%82%A4%E3%82%B9-2002": (
                "LS ルイス",
                "2002",
                "na",
            ),
        }
        for url, expected_call in cases.items():
            with self.subTest(url=url):
                get_metadata.reset_mock()
                response = self.client.get(url)

                get_metadata.assert_called_once_with(*expected_call)
                self.assertContains(
                    response, "<title data-server-head>Summoner metadata</title>"
                )
                self.assertContains(response, 'name="description"')
                self.assertContains(response, 'property="og:description"')
                self.assertContains(response, 'property="og:type" content="profile"')
                self.assertContains(response, 'property="og:title"')
                self.assertContains(response, 'property="og:url"')
                self.assertContains(response, 'property="og:image"')
                self.assertContains(response, "data-server-head", count=7)

    @override_settings(REACT_PROXY_URL="http://localhost:3000")
    @patch("lolsite.views._get_summoner_meta_data")
    @patch("lolsite.views._get_match_meta_data")
    def test_match_page_includes_metadata(
        self, get_match_metadata, get_summoner_metadata
    ):
        get_match_metadata.return_value = {"title": "Match metadata"}

        response = self.client.get(
            "/na/LS%20%E3%83%AB%E3%82%A4%E3%82%B9-2002/NA1_1234567890"
        )

        get_match_metadata.assert_called_once_with(
            "LS ルイス", "2002", "na", "NA1_1234567890"
        )
        get_summoner_metadata.assert_not_called()
        self.assertContains(response, "<title data-server-head>Match metadata</title>")

    @override_settings(REACT_PROXY_URL="http://localhost:3000")
    def test_page_routes_use_frontend_shell(self):
        paths = [
            "/account/",
            "/data/items/",
            "/data/items/1001/history/",
            "/login",
            "/puuid/example/",
            "/signup/",
            "/verify/",
            "/na/name-tag/",
            "/na/name-tag/MATCH/",
            "/na/name-tag/MATCH/summary/",
        ]

        for path in paths:
            with self.subTest(path=path):
                self.assertContains(self.client.get(path), 'id="app"')
