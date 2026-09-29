package com.incidentmanagement.controller;

import com.incidentmanagement.dto.CreateIncidentRequest;
import com.incidentmanagement.dto.IncidentDetailResponse;
import com.incidentmanagement.dto.IncidentSummaryResponse;
import com.incidentmanagement.dto.UpdateIncidentRequest;
import com.incidentmanagement.model.IncidentStatus;
import com.incidentmanagement.service.IncidentService;
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
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    /** GET All Incidents - every incident with full details. */
    @GetMapping
    public List<IncidentDetailResponse> getAll() {
        return service.getAll();
    }

    /** GET Summary - lightweight list for the summary screen, with optional search and status filter. */
    @GetMapping("/summary")
    public List<IncidentSummaryResponse> getSummary(@RequestParam(required = false) String search,
                                                    @RequestParam(required = false) IncidentStatus status) {
        return service.getSummary(search, status);
    }

    /** GET Details - one incident by its number. */
    @GetMapping("/{incidentNumber}")
    public IncidentDetailResponse getDetails(@PathVariable String incidentNumber) {
        return service.getDetails(incidentNumber);
    }

    /** POST - create an incident. */
    @PostMapping
    public ResponseEntity<IncidentDetailResponse> create(@Valid @RequestBody CreateIncidentRequest request) {
        IncidentDetailResponse created = service.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{incidentNumber}")
                .buildAndExpand(created.incidentNumber())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** PUT - update status, description, dates and detailed analysis. */
    @PutMapping("/{incidentNumber}")
    public IncidentDetailResponse update(@PathVariable String incidentNumber,
                                         @Valid @RequestBody UpdateIncidentRequest request) {
        return service.update(incidentNumber, request);
    }

    /** DELETE - remove an incident by its number. */
    @DeleteMapping("/{incidentNumber}")
    public ResponseEntity<Void> delete(@PathVariable String incidentNumber) {
        service.delete(incidentNumber);
        return ResponseEntity.noContent().build();
    }
}
