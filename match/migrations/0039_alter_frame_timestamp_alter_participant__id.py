# Generated by Django 4.1.6 on 2023-06-15 16:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0038_stats_total_ally_jungle_minions_killed_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='frame',
            name='timestamp',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='participant',
            name='_id',
            field=models.IntegerField(),
        ),
    ]
