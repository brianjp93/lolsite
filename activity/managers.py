from datetime import timedelta
from typing import TYPE_CHECKING

from django.db.models import Manager

from ext.activity.api import NoApplication
from match.models import Match
from player.models import get_activity_api


if TYPE_CHECKING:
    from activity.models import Heartrate


class HeartrateManager(Manager['Heartrate']):
    def get_hr_for_match(self, match: Match, user):
        start = match.game_creation_dt
        end = start + timedelta(seconds=match.seconds)
        qs = self.get_queryset().filter(
            user=user,
            dt__gt=start,
            dt__lt=end,
        )
        return qs

    def import_hr_for_match(self, match: Match, user):
        try:
            api = get_activity_api(user)
        except NoApplication:
            return self.none()
        if not api:
            return self.none()
        start = match.game_creation_dt
        end = start + timedelta(seconds=match.seconds)
        hr = api.update_or_create_heartrate(start, end, user)
        return self.get_queryset().filter(id__in=[x.pk for x in hr]).order_by("dt")

    def format_for_match(self, match: Match, user):
        qs = self.get_hr_for_match(match, user).order_by("dt")
        hr_list = list(qs)
        if not hr_list:
            return []
        items = []
        hr = hr_list[0]
        hr_minute_map = {}
        for hr in hr_list:
            key = (hr.dt - match.game_creation_dt).total_seconds() // 60
            if key not in hr_minute_map:
                hr_minute_map[key] = hr
            elif hr.bpm > hr_minute_map[key].bpm:
                hr_minute_map[key] = hr
        seconds = (hr.dt - match.game_creation_dt).total_seconds()
        frame_count = int(match.minutes) + 1
        for frame_idx in range(frame_count):
            hr_maybe = hr_minute_map.get(frame_idx, None)
            if hr_maybe:
                hr = hr_maybe
                seconds = (hr.dt - match.game_creation_dt).total_seconds()
            items.append({"x": frame_idx, "y": hr.bpm, "seconds": seconds})
        return items
