# Generated by Django 2.1.5 on 2019-02-08 23:30

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0015_auto_20190208_0229'),
    ]

    operations = [
        migrations.CreateModel(
            name='SummonerSpell',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('_id', models.CharField(blank=True, db_index=True, default='', max_length=128)),
                ('key', models.IntegerField(db_index=True)),
                ('version', models.CharField(db_index=True, max_length=128)),
                ('language', models.CharField(db_index=True, max_length=128)),
                ('cooldown_burn', models.CharField(blank=True, default='', max_length=128)),
                ('cost_burn', models.CharField(blank=True, default='', max_length=128)),
                ('cost_type', models.CharField(blank=True, default='', max_length=128)),
                ('description', models.CharField(blank=True, default='', max_length=2048)),
                ('max_ammo', models.CharField(blank=True, default='', max_length=128)),
                ('max_rank', models.IntegerField()),
                ('name', models.CharField(blank=True, default='', max_length=128)),
                ('range_burn', models.CharField(blank=True, default='', max_length=256)),
                ('resource', models.CharField(blank=True, default='', max_length=128, null=True)),
                ('summoner_level', models.IntegerField()),
                ('tooltip', models.TextField(blank=True, default='', max_length=2048)),
            ],
        ),
        migrations.CreateModel(
            name='SummonerSpellEffectBurn',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(blank=True, default='', max_length=32)),
                ('sort_int', models.IntegerField()),
                ('spell', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='effect_burn', to='data.SummonerSpell')),
            ],
        ),
        migrations.CreateModel(
            name='SummonerSpellImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full', models.CharField(blank=True, default='', max_length=256)),
                ('group', models.CharField(blank=True, default='', max_length=128)),
                ('h', models.IntegerField()),
                ('sprite', models.CharField(blank=True, default='', max_length=128)),
                ('w', models.IntegerField()),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('spell', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='image', to='data.SummonerSpell')),
            ],
        ),
        migrations.CreateModel(
            name='SummonerSpellMode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, default='', max_length=128)),
                ('sort_int', models.IntegerField()),
                ('spell', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='modes', to='data.SummonerSpell')),
            ],
        ),
        migrations.CreateModel(
            name='SummonerSpellVar',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('coeff', models.CharField(blank=True, default='', max_length=1024)),
                ('key', models.CharField(blank=True, default='', max_length=128)),
                ('link', models.CharField(blank=True, default='', max_length=128)),
                ('sort_int', models.IntegerField()),
                ('spell', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vars', to='data.SummonerSpell')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='summonerspell',
            unique_together={('key', 'version', 'language')},
        ),
        migrations.AlterUniqueTogether(
            name='summonerspellvar',
            unique_together={('spell', 'sort_int')},
        ),
        migrations.AlterUniqueTogether(
            name='summonerspellmode',
            unique_together={('spell', 'name')},
        ),
        migrations.AlterUniqueTogether(
            name='summonerspelleffectburn',
            unique_together={('spell', 'sort_int')},
        ),
    ]
