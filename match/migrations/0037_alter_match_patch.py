# Generated by Django 4.1.6 on 2023-02-21 01:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0036_alter_participant_champion_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='match',
            name='patch',
            field=models.IntegerField(blank=True, default=None, null=True),
        ),
    ]