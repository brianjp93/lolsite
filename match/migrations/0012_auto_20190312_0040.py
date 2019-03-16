# Generated by Django 2.1.5 on 2019-03-12 00:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0011_auto_20190305_0608'),
    ]

    operations = [
        migrations.CreateModel(
            name='Spectate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_id', models.CharField(blank=True, default='', max_length=128)),
                ('encryption_key', models.CharField(blank=True, default='', max_length=256)),
                ('platform_id', models.CharField(blank=True, default='', max_length=32)),
                ('region', models.CharField(blank=True, default='', max_length=32)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='spectate',
            unique_together={('game_id', 'region')},
        ),
    ]