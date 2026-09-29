package com.incidentmanagement.dto;

import com.incidentmanagement.model.IncidentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateIncidentRequest(
        @NotBlank(message = "Incident number is required")
        @Size(max = 50, message = "Incident number must be at most 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Incident number may contain only letters, digits, '-' and '_'")
        String incidentNumber,

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
