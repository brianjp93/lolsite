from datetime import timedelta

from django.db.models import Manager

from match.models import Match
from player.models import get_activity_api


class HeartrateManager(Manager):
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
        api = get_activity_api(user)
        if not api:
            return self.none()
        start = match.game_creation_dt
        end = start + timedelta(seconds=match.seconds)
        hr = api.update_or_create_heartrate(start, end, user)
        return self.get_queryset().filter(id__in=[x.pk for x in hr])

    def format_for_match(self, match: Match, user):
        qs = self.get_hr_for_match(match, user).order_by("dt")
        hr_list = list(qs)
        items = []
        i = frame_idx = 0
        if not hr_list:
            return []
        hr = hr_list[0]
        while True:
            if i < len(hr_list):
                hr = hr_list[i]
            seconds = (hr.dt - match.game_creation_dt).total_seconds()
            minute = seconds / 60
            items.append({"x": frame_idx, "y": hr.bpm, "seconds": seconds})
            if frame_idx > minute:
                i += 1
            if frame_idx > match.minutes:
                break
            frame_idx += 1
        return items
