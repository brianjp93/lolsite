# Generated by Django 3.1.8 on 2021-06-05 23:33

from django.db import migrations, models


def forward_set_defaults(apps, schema_editor):
    Match = apps.get_model('match', 'Match')
    Match.objects.all().update(is_fully_imported=True)


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0026_auto_20210222_0310'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='is_fully_imported',
            field=models.BooleanField(blank=True, db_index=True, default=False),
        ),
        migrations.RunPython(forward_set_defaults, migrations.RunPython.noop),
    ]
