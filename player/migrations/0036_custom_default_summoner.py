# Generated by Django 3.0.7 on 2021-01-19 04:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('player', '0035_auto_20201007_1619'),
    ]

    operations = [
        migrations.AddField(
            model_name='custom',
            name='default_summoner',
            field=models.OneToOneField(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, to='player.Summoner'),
        ),
    ]
