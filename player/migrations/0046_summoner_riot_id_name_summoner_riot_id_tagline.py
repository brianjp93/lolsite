# Generated by Django 4.2.7 on 2023-11-04 20:28

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("player", "0045_alter_summoner__id"),
    ]

    operations = [
        migrations.AddField(
            model_name="summoner",
            name="riot_id_name",
            field=models.CharField(default="", max_length=32),
        ),
        migrations.AddField(
            model_name="summoner",
            name="riot_id_tagline",
            field=models.CharField(default="", max_length=8),
        ),
    ]
