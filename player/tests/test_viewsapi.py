from datetime import datetime, timedelta, timezone

from django.urls import reverse
from rest_framework.test import APITestCase

from match.tests.factories import MatchFactory, ParticipantFactory, TeamFactory
from player.tests.factories import SummonerFactory


class ChampionMatchupAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.summoner = SummonerFactory()
        cls.start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        games = [(420, 2, True), (420, 2, False), (440, 2, True), (450, 3, False)]
        for index, (queue, opponent, win) in enumerate(games):
            match = MatchFactory(
                queue_id=queue,
                game_creation=int(
                    (cls.start + timedelta(days=index)).timestamp() * 1000
                ),
            )
            TeamFactory(match=match, _id=100, win=win)
            TeamFactory(match=match, _id=200, win=not win)
            ParticipantFactory(
                match=match,
                puuid=cls.summoner.puuid,
                champion_id=1,
                team_id=100,
                individual_position="TOP",
            )
            ParticipantFactory(
                match=match,
                champion_id=opponent,
                team_id=200,
                individual_position="TOP",
            )

    def setUp(self):
        self.url = reverse("champion-matchups", kwargs={"puuid": self.summoner.puuid})

    def test_returns_serialized_matchups_without_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "champion_id": 1,
                    "opponent_champion_id": 2,
                    "individual_position": "TOP",
                    "game_count": 3,
                    "win_count": 2,
                    "win_percentage": 2 / 3,
                },
                {
                    "champion_id": 1,
                    "opponent_champion_id": 3,
                    "individual_position": "TOP",
                    "game_count": 1,
                    "win_count": 0,
                    "win_percentage": 0.0,
                },
            ],
        )

    def test_browsable_api_renders_filter_form(self):
        response = self.client.get(self.url, HTTP_ACCEPT="text/html")
        for field in ("start_dt", "end_dt", "queue_ids"):
            self.assertContains(response, f'name="{field}"')

    def test_filters_apply_before_aggregation(self):
        cases = [
            ({"start_dt": "2026-01-02T00:00:00Z"}, 2, 2, 0.5),
            ({"end_dt": "2026-01-02T00:00:00Z"}, 1, 2, 0.5),
            (
                {
                    "start_dt": "2026-01-02T00:00:00Z",
                    "end_dt": "2026-01-03T00:00:00Z",
                },
                1,
                2,
                0.5,
            ),
            ({"queue_ids": "420"}, 1, 2, 0.5),
            ({"queue_ids": "420,440"}, 1, 3, 2 / 3),
            (
                {
                    "start_dt": "2026-01-02T00:00:00Z",
                    "end_dt": "2026-01-03T00:00:00Z",
                    "queue_ids": "420",
                },
                1,
                1,
                0.0,
            ),
        ]
        for params, group_count, game_count, win_percentage in cases:
            with self.subTest(params=params):
                response = self.client.get(self.url, params)
                self.assertEqual(response.status_code, 200)
                rows = response.json()
                self.assertEqual(len(rows), group_count)
                self.assertEqual(rows[0]["game_count"], game_count)
                self.assertEqual(rows[0]["win_count"] / game_count, win_percentage)
                self.assertEqual(rows[0]["win_percentage"], win_percentage)

    def test_rejects_invalid_filters(self):
        cases = [
            ("start_dt", "not-a-date"),
            ("end_dt", "2026-13-01T00:00:00Z"),
            ("queue_ids", "420,nope"),
            ("queue_ids", "420.5"),
        ]
        for field, value in cases:
            with self.subTest(field=field, value=value):
                response = self.client.get(self.url, {field: value})
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.json())

    def test_query_puuid_cannot_override_path(self):
        response = self.client.get(self.url, {"puuid": "unknown"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["game_count"], 3)

    def test_unknown_summoner_returns_not_found(self):
        url = reverse("champion-matchups", kwargs={"puuid": "unknown"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_no_matches_returns_empty_list(self):
        summoner = SummonerFactory()
        url = reverse("champion-matchups", kwargs={"puuid": summoner.puuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_nonmatching_filters_return_empty_list(self):
        response = self.client.get(self.url, {"queue_ids": "999"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_post_is_not_allowed(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 405)
