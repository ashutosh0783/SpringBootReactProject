-- Sample data for the in-memory H2 profile (same as database/init/01-schema.sql for MySQL)
INSERT INTO incident (incident_number, status, description, detailed_analysis, created_date, closed_date, created_at, updated_at) VALUES
('INC-1001', 'OPEN', 'Payment service returning HTTP 500 for card payments', NULL, '2026-09-20', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('INC-1002', 'IN_PROGRESS', 'Login page slow during peak hours',
 'Initial investigation shows connection pool exhaustion on the auth service. Monitoring added.', '2026-09-22', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('INC-1003', 'CLOSED', 'Nightly report job failed',
 'Root cause: disk full on batch server due to unrotated logs. Fix: enabled logrotate, cleaned 40GB, re-ran job successfully. Preventive action: disk usage alert at 80%.',
 '2026-09-15', '2026-09-16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
