# Generated by Django 4.1.2 on 2023-01-22 22:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0034_remove_stats_first_inhibitor_assist_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='match',
            name='is_fully_imported',
            field=models.BooleanField(blank=True, default=False),
        ),
    ]
