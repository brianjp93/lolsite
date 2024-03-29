# Generated by Django 4.2.7 on 2023-11-07 03:23

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("match", "0043_participant_riot_id_name_participant_riot_id_tagline"),
    ]

    operations = [
        migrations.CreateModel(
            name="MatchSummary",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("content", models.TextField(default="")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "match",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, to="match.match"
                    ),
                ),
            ],
        ),
    ]
