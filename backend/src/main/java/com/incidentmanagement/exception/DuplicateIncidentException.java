package com.incidentmanagement.exception;

public class DuplicateIncidentException extends RuntimeException {
    public DuplicateIncidentException(String incidentNumber) {
        super("Incident " + incidentNumber + " already exists");
    }
}
