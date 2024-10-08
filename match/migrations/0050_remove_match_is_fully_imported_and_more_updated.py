# Generated by Django 5.1.1 on 2024-10-07 02:17

import django.db.models.expressions
import match.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0049_remove_stats_riot_id_name_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='match',
            name='is_fully_imported',
        ),
        migrations.AddField(
            model_name='match',
            name='game_creation_dt',
            field=models.GeneratedField(db_index=True, db_persist=True, expression=match.models.ToTimestamp(django.db.models.expressions.CombinedExpression(models.F('game_creation'), '/', models.Value(1000))), output_field=models.DateTimeField()),
        ),
    ]