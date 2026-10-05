from django.db import migrations


VIEW_NAME = 'services_provider_earnings_report'


def create_report_view(apps, schema_editor):
    connection = schema_editor.connection
    quote = connection.ops.quote_name
    view_name = quote(VIEW_NAME)

    if connection.vendor == 'mysql':
        month_expression = (
            "DATE_FORMAT(report_booking.completed_at, '%%Y-%%m')"
        )
        matching_month_expression = (
            "DATE_FORMAT(earning_booking.completed_at, '%%Y-%%m')"
        )
        year_expression = (
            "DATE_FORMAT(report_booking.completed_at, '%%Y')"
        )
        matching_year_expression = (
            "DATE_FORMAT(earning_booking.completed_at, '%%Y')"
        )
    elif connection.vendor == 'sqlite':
        month_expression = (
            "strftime('%Y-%m', report_booking.completed_at)"
        )
        matching_month_expression = (
            "strftime('%Y-%m', earning_booking.completed_at)"
        )
        year_expression = (
            "strftime('%Y', report_booking.completed_at)"
        )
        matching_year_expression = (
            "strftime('%Y', earning_booking.completed_at)"
        )
    else:
        raise RuntimeError(
            'Provider earnings report view supports MySQL and SQLite.'
        )

    sql = f"""
        CREATE VIEW {view_name} AS
        SELECT
            report_booking.id AS booking_id,
            provider_profile.id AS provider_id,
            provider_profile.business_name AS provider_name,
            provider_user.email AS provider_email,
            customer_user.id AS customer_id,
            customer_user.username AS customer_username,
            customer_user.first_name AS customer_first_name,
            customer_user.last_name AS customer_last_name,
            customer_user.email AS customer_email,
            service_record.id AS service_id,
            service_record.name AS service_name,
            service_record.deleted_at AS service_deleted_at,
            CASE
                WHEN service_record.deleted_at IS NULL THEN 0
                ELSE 1
            END AS service_is_deleted,
            service_record.price AS current_service_price,
            report_booking.status AS booking_status,
            report_booking.booking_date AS booking_date,
            report_booking.booking_time AS booking_time,
            report_booking.created_at AS booking_created_at,
            report_booking.completed_at AS completed_at,
            report_booking.completed_price AS completed_price,
            CASE
                WHEN report_booking.status = 'completed'
                THEN COALESCE(
                    report_booking.completed_price,
                    service_record.price
                )
                ELSE 0
            END AS earned_amount,
            CASE
                WHEN report_booking.status = 'completed'
                THEN (
                    SELECT COALESCE(
                        SUM(
                            COALESCE(
                                earning_booking.completed_price,
                                earning_service.price
                            )
                        ),
                        0
                    )
                    FROM services_booking AS earning_booking
                    INNER JOIN services_service AS earning_service
                        ON earning_service.id = earning_booking.service_id
                    WHERE earning_service.provider_id =
                        service_record.provider_id
                        AND earning_booking.status = 'completed'
                        AND {matching_month_expression} =
                            {month_expression}
                )
                ELSE 0
            END AS provider_monthly_earnings,
            CASE
                WHEN report_booking.status = 'completed'
                THEN (
                    SELECT COALESCE(
                        SUM(
                            COALESCE(
                                earning_booking.completed_price,
                                earning_service.price
                            )
                        ),
                        0
                    )
                    FROM services_booking AS earning_booking
                    INNER JOIN services_service AS earning_service
                        ON earning_service.id = earning_booking.service_id
                    WHERE earning_service.provider_id =
                        service_record.provider_id
                        AND earning_booking.status = 'completed'
                        AND {matching_year_expression} =
                            {year_expression}
                )
                ELSE 0
            END AS provider_yearly_earnings
        FROM services_booking AS report_booking
        INNER JOIN services_service AS service_record
            ON service_record.id = report_booking.service_id
        LEFT JOIN services_serviceprovider AS provider_profile
            ON provider_profile.id = service_record.provider_id
        LEFT JOIN auth_user AS provider_user
            ON provider_user.id = provider_profile.user_id
        INNER JOIN auth_user AS customer_user
            ON customer_user.id = report_booking.user_id
    """
    schema_editor.execute(sql)


def drop_report_view(apps, schema_editor):
    quote = schema_editor.connection.ops.quote_name
    schema_editor.execute(
        f'DROP VIEW IF EXISTS {quote(VIEW_NAME)}'
    )


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ('services', '0008_contactmessage'),
    ]

    operations = [
        migrations.RunPython(
            create_report_view,
            reverse_code=drop_report_view,
        ),
    ]
