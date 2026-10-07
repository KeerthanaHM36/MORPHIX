import psycopg2

conn = psycopg2.connect(
    dbname="MORPHIX",
    user="postgres",
    password="12345678910",
    host="localhost",
    port=5432
)
conn.autocommit = True
cur = conn.cursor()

indexes_to_create = [
    ("idx_users_email", "users", "(email)"),
    ("idx_sites_org_id", "sites", "(organization_id)"),
    ("idx_machines_site_id", "machines", "(site_id)"),
    ("idx_machines_status", "machines", "(status)"),
    ("idx_machines_criticality", "machines", "(criticality)"),
    ("idx_technicians_avail_status", "technicians", "(availability_status)"),
    ("idx_tech_avail_tech_date", "technician_availability", "(technician_id, availability_date)"),
    ("idx_service_requests_status", "service_requests", "(status)"),
    ("idx_service_requests_priority", "service_requests", "(priority)"),
    ("idx_service_requests_machine_id", "service_requests", "(machine_id)"),
    ("idx_service_requests_site_id", "service_requests", "(site_id)"),
    ("idx_service_requests_sla", "service_requests", "(sla_deadline)"),
    ("idx_assignments_tech_id", "assignments", "(technician_id)"),
    ("idx_assignments_request_id", "assignments", "(service_request_id)"),
    ("idx_assignments_sched_start", "assignments", "(scheduled_start)"),
    ("idx_exceptions_status", "exceptions", "(status)"),
    ("idx_exceptions_severity", "exceptions", "(severity)"),
    ("idx_exceptions_request_id", "exceptions", "(service_request_id)"),
    ("idx_notifications_user_unread", "notifications", "(user_id, is_read)"),
    ("idx_audit_logs_entity", "audit_logs", "(entity_type, entity_id)")
]

print("Applying indexes if not exists...")
for idx_name, table, cols in indexes_to_create:
    sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} {cols};"
    cur.execute(sql)
    print(f"Index verified: {idx_name} on {table}")

cur.close()
conn.close()
print("All performance indexes verified and created successfully.")
