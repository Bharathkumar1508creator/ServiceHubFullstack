from django.db import migrations

from services.report_views import (
    create_report_view,
    drop_report_view,
)


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ('services', '0010_service_created_at'),
    ]

    operations = [
        migrations.RunPython(
            create_report_view,
            reverse_code=drop_report_view,
        ),
    ]
