from django.apps import apps
from django.db import models
from django.core.files import File

from lolsite.celery import app
from PIL import Image
from io import BytesIO
import urllib


class VersionedModel(models.Model):
    major = models.IntegerField(default=None, null=True, blank=True, db_index=True)
    minor = models.IntegerField(default=None, null=True, blank=True, db_index=True)
    patch = models.IntegerField(default=None, null=True, blank=True)

    version: models.CharField[str, str]

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


def save_location(instance, name):
    return f'IMAGECACHE/{instance._meta.model_name}.{instance.id}.{name}'


@app.task(name='core.models.save_files')
def save_files(model_id, app, model_name, force=False):
    model = apps.get_model(app, model_name=model_name)
    obj: 'ThumbnailedModel' = model.objects.get(id=model_id)
    if not obj.file or force:
        r = urllib.request.urlretrieve(obj.image_url())
        obj.file.save(obj.full, File(open(r[0], 'rb')))
    obj.refresh_from_db()
    image = Image.open(obj.file)
    for size in obj.SIZES:
        attr = f'file_{size}'
        if not getattr(obj, attr) or force:
            output = BytesIO()
            temp = image.resize((size, size))
            temp.save(output, format='JPEG', quality=80)
            name = f'{size}-{obj.full.lower().strip(".png")}.jpg'
            new_image = File(output, name=name)
            field = getattr(obj, attr)
            field.save(name, new_image)


class ThumbnailedModel(models.Model):
    id: int | None
    SIZES = [15, 30, 40]
    file = models.ImageField(upload_to=save_location, default=None, null=True, blank=True)
    file_15 = models.ImageField(upload_to=save_location, default=None, null=True, blank=True)
    file_30 = models.ImageField(upload_to=save_location, default=None, null=True, blank=True)
    file_40 = models.ImageField(upload_to=save_location, default=None, null=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        super().save()
        self.save_files()

    def save_files(self, force=False, sync=False):
        fields = [self.file] + [getattr(self, f'file_{size}') for size in self.SIZES]
        if not all(fields) or force:
            args = (self.id, self._meta.app_label, self._meta.model_name)
            kwargs = {'force': force}
            if sync:
                save_files(*args, **kwargs)
            else:
                save_files.delay(*args, **kwargs)

    def image_url(self):
        raise NotImplementedError()

    def thumbs(self):
        thumbs = {}
        for attr in [f'file_{size}' for size in self.SIZES]:
            field = getattr(self, attr)
            if not field:
                self.save_files(sync=True)
                self.refresh_from_db()
                field = getattr(self, attr)
            thumbs[attr] = field.url
        return thumbs
