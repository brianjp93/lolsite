# Generated by Django 4.2.7 on 2024-02-11 23:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0046_add_created_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='participant',
            name='riot_id_name',
            field=models.CharField(default='', max_length=64),
        ),
    ]
