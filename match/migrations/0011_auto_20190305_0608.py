# Generated by Django 2.1.5 on 2019-03-05 06:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0010_auto_20190304_0857'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='position',
            name='participantframe',
        ),
        migrations.AddField(
            model_name='participantframe',
            name='team_score',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name='participantframe',
            name='total_gold',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name='participantframe',
            name='x',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name='participantframe',
            name='xp',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name='participantframe',
            name='y',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.DeleteModel(
            name='Position',
        ),
    ]
