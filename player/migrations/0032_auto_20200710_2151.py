# Generated by Django 3.0.7 on 2020-07-10 21:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('player', '0031_comment_is_deleted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='summonerlink',
            name='uuid',
            field=models.CharField(blank=True, db_index=True, default='', max_length=128),
        ),
    ]