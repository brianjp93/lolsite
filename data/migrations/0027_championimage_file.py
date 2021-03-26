# Generated by Django 3.1.6 on 2021-03-26 07:23

import data.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0026_create_versioned_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='championimage',
            name='file',
            field=models.ImageField(blank=True, default=None, null=True, upload_to=data.models.champion_image_location),
        ),
    ]
