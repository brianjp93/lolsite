# Generated by Django 2.2.2 on 2020-03-11 20:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('match', '0019_auto_20191121_1941'),
    ]

    operations = [
        migrations.AlterField(
            model_name='participant',
            name='_id',
            field=models.IntegerField(db_index=True),
        ),
    ]
