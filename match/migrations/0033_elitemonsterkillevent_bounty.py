# Generated by Django 3.2.12 on 2022-03-05 17:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0032_auto_20220224_1419'),
    ]

    operations = [
        migrations.AddField(
            model_name='elitemonsterkillevent',
            name='bounty',
            field=models.PositiveIntegerField(blank=True, default=0),
        ),
    ]