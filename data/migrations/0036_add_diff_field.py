# Generated by Django 4.2.7 on 2024-04-07 06:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0035_add_stats'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='diff',
            field=models.JSONField(default=None, null=True),
        ),
    ]