package com.incidentmanagement.dto;

import com.incidentmanagement.model.IncidentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateIncidentRequest(
        @Schema(example = "INC-2001", description = "Unique; stored upper-case")
        @NotBlank(message = "Incident number is required")
        @Size(max = 50, message = "Incident number must be at most 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Incident number may contain only letters, digits, '-' and '_'")
        String incidentNumber,

        @Schema(example = "OPEN")
        @NotNull(message = "Status is required")
        IncidentStatus status,

        @Schema(example = "Checkout page timing out for some users")
        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @Schema(example = "Investigating: gateway latency spikes observed since 09:00.",
                description = "Required when status is CLOSED")
        String detailedAnalysis,

        @Schema(example = "2026-09-29")
        @NotNull(message = "Date of creation is required")
        LocalDate createdDate,

        @Schema(nullable = true,
                description = "Only used when status is CLOSED; defaults to today")
        LocalDate closedDate
) {
}
