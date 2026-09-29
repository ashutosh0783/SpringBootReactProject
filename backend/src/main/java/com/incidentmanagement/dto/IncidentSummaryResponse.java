package com.incidentmanagement.dto;

import com.incidentmanagement.model.Incident;
import com.incidentmanagement.model.IncidentStatus;

import java.time.LocalDate;

/**
 * Lightweight row for the summary screen: no detailed analysis.
 */
public record IncidentSummaryResponse(
        String incidentNumber,
        String description,
        IncidentStatus status,
        boolean open,
        LocalDate createdDate,
        LocalDate closedDate
) {
    public static IncidentSummaryResponse from(Incident i) {
        return new IncidentSummaryResponse(
                i.getIncidentNumber(),
                i.getDescription(),
                i.getStatus(),
                !i.getStatus().isClosed(),
                i.getCreatedDate(),
                i.getClosedDate());
    }
}
