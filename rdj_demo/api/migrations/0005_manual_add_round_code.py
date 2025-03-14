from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0004_add_status_to_round'),  # Replace with the name of your most recent migration
    ]

    operations = [
        migrations.AddField(
            model_name='round',
            name='round_code',
            field=models.CharField(blank=True, max_length=6, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='round',
            name='is_active',
            field=models.BooleanField(default=False),
        ),
    ]