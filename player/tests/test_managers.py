from datetime import datetime, timedelta, timezone

from django.test import TestCase

from match.models import Participant, Team
from match.tests.factories import MatchFactory, ParticipantFactory, TeamFactory
from player.models import Summoner
from player.tests.factories import SummonerFactory


class ChampionMatchupsTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.summoner = SummonerFactory()
        cls.start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        cls.matches = []
        games = [
            (420, 1, 2, "TOP", True),
            (420, 1, 2, "TOP", False),
            (440, 1, 2, "TOP", True),
            (450, 1, 3, "TOP", False),
            (420, 4, 2, "TOP", True),
            (420, 1, 2, "MIDDLE", False),
        ]
        for index, (queue, champion, opponent, position, win) in enumerate(games):
            match = MatchFactory(
                queue_id=queue,
                game_creation=int(
                    (cls.start + timedelta(days=index)).timestamp() * 1000
                ),
            )
            cls.matches.append(match)
            team_id = 100 if index % 2 == 0 else 200
            other_team_id = 300 - team_id
            TeamFactory(match=match, _id=team_id, win=win)
            TeamFactory(match=match, _id=other_team_id, win=not win)
            ParticipantFactory(
                match=match,
                puuid=cls.summoner.puuid,
                champion_id=champion,
                team_id=team_id,
                individual_position=position,
            )
            ParticipantFactory(
                match=match,
                champion_id=opponent,
                team_id=other_team_id,
                individual_position=position,
            )
            ParticipantFactory(
                match=match,
                champion_id=999,
                team_id=team_id,
                individual_position=position,
            )
            ParticipantFactory(
                match=match,
                champion_id=999,
                team_id=other_team_id,
                individual_position="JUNGLE",
            )

    def test_groups_matchups_and_orders_by_game_count(self):
        with self.assertNumQueries(1):
            rows = list(Summoner.objects.get_champion_matchups(self.summoner))

        self.assertEqual(
            rows[0],
            {
                "champion_id": 1,
                "opponent_champion_id": 2,
                "individual_position": "TOP",
                "game_count": 3,
                "win_count": 2,
                "win_percentage": 2 / 3,
            },
        )
        self.assertCountEqual(
            rows[1:],
            [
                {
                    "champion_id": 1,
                    "opponent_champion_id": 3,
                    "individual_position": "TOP",
                    "game_count": 1,
                    "win_count": 0,
                    "win_percentage": 0.0,
                },
                {
                    "champion_id": 4,
                    "opponent_champion_id": 2,
                    "individual_position": "TOP",
                    "game_count": 1,
                    "win_count": 1,
                    "win_percentage": 1.0,
                },
                {
                    "champion_id": 1,
                    "opponent_champion_id": 2,
                    "individual_position": "MIDDLE",
                    "game_count": 1,
                    "win_count": 0,
                    "win_percentage": 0.0,
                },
            ],
        )

    def test_optional_filters(self):
        cases = [
            ({"start_dt": self.start + timedelta(days=2)}, 4, 1, 1.0),
            ({"end_dt": self.start + timedelta(days=1)}, 1, 2, 0.5),
            (
                {
                    "start_dt": self.start + timedelta(days=1),
                    "end_dt": self.start + timedelta(days=2),
                },
                1,
                2,
                0.5,
            ),
            ({"queue_ids": [420]}, 3, 2, 0.5),
            ({"queue_ids": [420, 440]}, 3, 3, 2 / 3),
            (
                {
                    "start_dt": self.start,
                    "end_dt": self.start + timedelta(days=2),
                    "queue_ids": [440],
                },
                1,
                1,
                1.0,
            ),
        ]
        for filters, group_count, game_count, win_percentage in cases:
            with self.subTest(filters=filters):
                rows = Summoner.objects.get_champion_matchups(self.summoner, **filters)
                self.assertEqual(len(rows), group_count)
                matchup = rows.get(
                    champion_id=1,
                    opponent_champion_id=2,
                    individual_position="TOP",
                )
                self.assertEqual(matchup["game_count"], game_count)
                self.assertEqual(matchup["win_count"] / game_count, win_percentage)
                self.assertEqual(matchup["win_percentage"], win_percentage)

    def test_empty_results(self):
        self.assertEqual(
            list(Summoner.objects.get_champion_matchups(SummonerFactory())), []
        )
        for queue_ids in ([], [999]):
            with self.subTest(queue_ids=queue_ids):
                self.assertEqual(
                    list(
                        Summoner.objects.get_champion_matchups(
                            self.summoner, queue_ids=queue_ids
                        )
                    ),
                    [],
                )

    def test_excludes_matches_without_an_opponent(self):
        Participant.objects.filter(
            match=self.matches[0], team_id=200, individual_position="TOP"
        ).delete()
        row = Summoner.objects.get_champion_matchups(self.summoner)[0]
        self.assertEqual(row["game_count"], 2)
        self.assertEqual(row["win_percentage"], 0.5)

    def test_excludes_matches_without_a_team(self):
        Team.objects.filter(match=self.matches[0], _id=100).delete()
        row = Summoner.objects.get_champion_matchups(self.summoner)[0]
        self.assertEqual(row["game_count"], 2)
        self.assertEqual(row["win_percentage"], 0.5)

    def test_null_positions_do_not_match(self):
        Participant.objects.filter(match=self.matches[0]).update(
            individual_position=None
        )
        row = Summoner.objects.get_champion_matchups(self.summoner)[0]
        self.assertEqual(row["game_count"], 2)
        self.assertEqual(row["win_percentage"], 0.5)
