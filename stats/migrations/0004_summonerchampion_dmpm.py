# Generated by Django 5.1.2 on 2024-11-04 02:14

import django.db.models.expressions
import django.db.models.functions.comparison
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0003_remove_summonerchampion_dmpm'),
    ]

    operations = [
        migrations.AddField(
            model_name='summonerchampion',
            name='dmpm',
            field=models.GeneratedField(db_persist=True, expression=django.db.models.expressions.CombinedExpression(django.db.models.expressions.CombinedExpression(models.F('damage_mitigated'), '/', django.db.models.functions.comparison.Greatest(django.db.models.functions.comparison.Cast('total_seconds', models.FloatField()), 1.0)), '*', models.Value(60.0)), help_text='damage mitigated per minute', output_field=models.FloatField()),
        ),
    ]
