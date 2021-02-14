from django.db import models


class VersionedModel(models.Model):
    major = models.IntegerField(default=None, null=True, blank=True, db_index=True)
    minor = models.IntegerField(default=None, null=True, blank=True, db_index=True)
    patch = models.IntegerField(default=None, null=True, blank=True, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.major is None:
            parts = [int(x) for x in self.version.split(".")]
            for val, attr in zip(parts, ["major", "minor", "patch"]):
                setattr(self, attr, val)
        return super().save(*args, **kwargs)


class TimestampedModel(models.Model):
    created = models.DateTimeField(auto_now_add=True, null=False, blank=True)
    modified = models.DateTimeField(auto_now=True, null=False, blank=True)

    class Meta:
        abstract = True
