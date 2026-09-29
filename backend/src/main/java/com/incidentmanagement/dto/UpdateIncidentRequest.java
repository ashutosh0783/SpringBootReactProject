package com.incidentmanagement.dto;

import com.incidentmanagement.model.IncidentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for PUT. The incident number comes from the URL and cannot be changed.
 */
public record UpdateIncidentRequest(
        @Schema(example = "CLOSED")
        @NotNull(message = "Status is required")
        IncidentStatus status,

        @Schema(example = "Payment service returning HTTP 500 for card payments")
        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description must be at most 500 characters")
        String description,

        @Schema(example = "Root cause: expired TLS certificate on the card gateway. Fix: renewed certificate. "
                + "Prevention: certificate expiry alerts 30 days ahead.",
                description = "Required when status is CLOSED")
        String detailedAnalysis,

        @Schema(example = "2026-09-20")
        @NotNull(message = "Date of creation is required")
        LocalDate createdDate,

        @Schema(example = "2026-09-29", nullable = true,
                description = "Only used when status is CLOSED; defaults to today")
        LocalDate closedDate
) {
}
