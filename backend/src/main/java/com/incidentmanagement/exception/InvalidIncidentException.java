package com.incidentmanagement.exception;

/**
 * Business-rule violation, e.g. closing an incident without analysis.
 */
public class InvalidIncidentException extends RuntimeException {
    private final String field;

    public InvalidIncidentException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
