# Generated by Django 2.1.5 on 2019-03-14 02:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('player', '0009_rankcheckpoint_rankposition'),
    ]

    operations = [
        migrations.AlterField(
            model_name='summoner',
            name='account_id',
            field=models.CharField(blank=True, db_index=True, default='', max_length=128, null=True, unique=True),
        ),
    ]
