# Generated by Django 3.2.12 on 2022-02-24 14:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0031_auto_20211007_0229'),
    ]

    operations = [
        migrations.AddField(
            model_name='buildingkillevent',
            name='bounty',
            field=models.PositiveIntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name='championkillevent',
            name='shutdown_bounty',
            field=models.PositiveIntegerField(blank=True, default=0),
        ),
    ]
