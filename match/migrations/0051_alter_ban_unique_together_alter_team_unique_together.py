# Generated by Django 5.1.1 on 2024-10-12 20:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0050_remove_match_is_fully_imported_and_more_updated'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='ban',
            unique_together={('team', 'pick_turn')},
        ),
        migrations.AlterUniqueTogether(
            name='team',
            unique_together={('_id', 'match')},
        ),
    ]
