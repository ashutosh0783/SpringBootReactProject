package com.incidentmanagement.dto;

import com.incidentmanagement.model.Incident;
import com.incidentmanagement.model.IncidentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record IncidentDetailResponse(
        Long id,
        String incidentNumber,
        IncidentStatus status,
        boolean open,
        String description,
        String detailedAnalysis,
        LocalDate createdDate,
        LocalDate closedDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static IncidentDetailResponse from(Incident i) {
        return new IncidentDetailResponse(
                i.getId(),
                i.getIncidentNumber(),
                i.getStatus(),
                !i.getStatus().isClosed(),
                i.getDescription(),
                i.getDetailedAnalysis(),
                i.getCreatedDate(),
                i.getClosedDate(),
                i.getCreatedAt(),
                i.getUpdatedAt());
    }
}
