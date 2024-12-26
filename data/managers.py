from django.db.models import Manager


class ItemManager(Manager):
    def item_history(self):
        return self.get_queryset().filter(
            diff__isnull=False
        ).exclude(diff={})
