-- Runs automatically the first time the MySQL container starts (empty data volume).
CREATE DATABASE IF NOT EXISTS incident_management;
USE incident_management;

CREATE TABLE IF NOT EXISTS incident (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    incident_number   VARCHAR(50)  NOT NULL,
    status            VARCHAR(20)  NOT NULL,
    description       VARCHAR(500) NOT NULL,
    detailed_analysis TEXT         NULL,
    created_date      DATE         NOT NULL,
    closed_date       DATE         NULL,
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_incident_number UNIQUE (incident_number),
    CONSTRAINT chk_incident_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
);

-- Sample data so the summary screen is not empty on first run
INSERT INTO incident (incident_number, status, description, detailed_analysis, created_date, closed_date) VALUES
('INC-1001', 'OPEN', 'Payment service returning HTTP 500 for card payments', NULL, '2026-09-20', NULL),
('INC-1002', 'IN_PROGRESS', 'Login page slow during peak hours',
 'Initial investigation shows connection pool exhaustion on the auth service. Monitoring added.', '2026-09-22', NULL),
('INC-1003', 'CLOSED', 'Nightly report job failed',
 'Root cause: disk full on batch server due to unrotated logs. Fix: enabled logrotate, cleaned 40GB, re-ran job successfully. Preventive action: disk usage alert at 80%.',
 '2026-09-15', '2026-09-16');
