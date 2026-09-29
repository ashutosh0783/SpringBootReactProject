package com.incidentmanagement.exception;

public class IncidentNotFoundException extends RuntimeException {
    public IncidentNotFoundException(String incidentNumber) {
        super("Incident " + incidentNumber + " not found");
    }
}
