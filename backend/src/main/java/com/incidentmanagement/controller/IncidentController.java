package com.incidentmanagement.controller;

import com.incidentmanagement.dto.CreateIncidentRequest;
import com.incidentmanagement.dto.IncidentDetailResponse;
import com.incidentmanagement.dto.IncidentSummaryResponse;
import com.incidentmanagement.dto.UpdateIncidentRequest;
import com.incidentmanagement.model.IncidentStatus;
import com.incidentmanagement.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@Tag(name = "Incidents", description = "Incident management operations")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @Operation(summary = "Get all incidents", description = "Every incident with full details, newest first.")
    @GetMapping
    public List<IncidentDetailResponse> getAll() {
        return service.getAll();
    }

    @Operation(summary = "Get incident summary", description = "Lightweight list for the summary screen. Optionally search by incident number or description and filter by status.")
    @GetMapping("/summary")
    public List<IncidentSummaryResponse> getSummary(@Parameter(description = "Text to match in incident number or description", example = "login")
                                                    @RequestParam(required = false) String search,
                                                    @Parameter(description = "Only incidents with this status")
                                                    @RequestParam(required = false) IncidentStatus status) {
        return service.getSummary(search, status);
    }

    @Operation(summary = "Get incident details", description = "One incident by its number, including the detailed analysis.")
    @ApiResponse(responseCode = "200", description = "Incident found")
    @ApiResponse(responseCode = "404", description = "Incident not found")
    @GetMapping("/{incidentNumber}")
    public IncidentDetailResponse getDetails(@Parameter(example = "INC-1001") @PathVariable String incidentNumber) {
        return service.getDetails(incidentNumber);
    }

    @Operation(summary = "Create an incident")
    @ApiResponse(responseCode = "201", description = "Incident created")
    @ApiResponse(responseCode = "400", description = "Validation failed (see fieldErrors)")
    @ApiResponse(responseCode = "409", description = "Incident number already exists")
    @PostMapping
    public ResponseEntity<IncidentDetailResponse> create(@Valid @RequestBody CreateIncidentRequest request) {
        IncidentDetailResponse created = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{incidentNumber}")
                .buildAndExpand(created.incidentNumber())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @Operation(summary = "Update an incident", description = "Update status, description, dates and detailed analysis. Set status to CLOSED (with a detailed analysis) to close it.")
    @ApiResponse(responseCode = "200", description = "Incident updated")
    @ApiResponse(responseCode = "400", description = "Validation failed (see fieldErrors)")
    @ApiResponse(responseCode = "404", description = "Incident not found")
    @PutMapping("/{incidentNumber}")
    public IncidentDetailResponse update(@Parameter(example = "INC-1001") @PathVariable String incidentNumber,
                                         @Valid @RequestBody UpdateIncidentRequest request) {
        return service.update(incidentNumber, request);
    }

    @Operation(summary = "Delete an incident")
    @ApiResponse(responseCode = "204", description = "Incident deleted")
    @ApiResponse(responseCode = "404", description = "Incident not found")
    @DeleteMapping("/{incidentNumber}")
    public ResponseEntity<Void> delete(@Parameter(example = "INC-1001") @PathVariable String incidentNumber) {
        service.delete(incidentNumber);
        return ResponseEntity.noContent().build();
    }
}
