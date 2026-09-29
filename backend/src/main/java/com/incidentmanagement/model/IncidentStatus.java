package com.incidentmanagement.model;

public enum IncidentStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    public boolean isClosed() {
        return this == CLOSED;
    }
}
