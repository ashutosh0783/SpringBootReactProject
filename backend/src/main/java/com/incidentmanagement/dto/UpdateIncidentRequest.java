package com.incidentmanagement.dto;

import com.incidentmanagement.model.IncidentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for PUT. The incident number comes from the URL and cannot be changed.
 */
public record UpdateIncidentRequest(
        @NotNull(message = "Status is required")
        IncidentStatus status,

        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        String detailedAnalysis,

        @NotNull(message = "Date of creation is required")
        LocalDate createdDate,

        LocalDate closedDate
) {
}
