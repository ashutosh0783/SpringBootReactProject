package com.incidentmanagement.service;

import com.incidentmanagement.dto.CreateIncidentRequest;
import com.incidentmanagement.dto.IncidentDetailResponse;
import com.incidentmanagement.dto.IncidentSummaryResponse;
import com.incidentmanagement.dto.UpdateIncidentRequest;
import com.incidentmanagement.exception.DuplicateIncidentException;
import com.incidentmanagement.exception.IncidentNotFoundException;
import com.incidentmanagement.exception.InvalidIncidentException;
import com.incidentmanagement.model.Incident;
import com.incidentmanagement.model.IncidentStatus;
import com.incidentmanagement.repository.IncidentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class IncidentService {

    private final IncidentRepository repository;

    public IncidentService(IncidentRepository repository) {
        this.repository = repository;
    }

    public List<IncidentDetailResponse> getAll() {
        return repository.findAll(Sort.by(Sort.Order.desc("createdDate"), Sort.Order.desc("id"))).stream()
                .map(IncidentDetailResponse::from)
                .toList();
    }

    public List<IncidentSummaryResponse> getSummary(String search, IncidentStatus status) {
        String text = (search == null || search.isBlank()) ? null : search.trim();
        return repository.search(text, status).stream()
                .map(IncidentSummaryResponse::from)
                .toList();
    }

    public IncidentDetailResponse getDetails(String incidentNumber) {
        return IncidentDetailResponse.from(find(incidentNumber));
    }

    @Transactional
    public IncidentDetailResponse create(CreateIncidentRequest req) {
        String number = req.incidentNumber().trim().toUpperCase();
        if (repository.existsByIncidentNumber(number)) {
            throw new DuplicateIncidentException(number);
        }
        Incident incident = new Incident();
        incident.setIncidentNumber(number);
        apply(incident, req.status(), req.description(), req.detailedAnalysis(), req.createdDate(), req.closedDate());
        return IncidentDetailResponse.from(repository.save(incident));
    }

    @Transactional
    public IncidentDetailResponse update(String incidentNumber, UpdateIncidentRequest req) {
        Incident incident = find(incidentNumber);
        apply(incident, req.status(), req.description(), req.detailedAnalysis(), req.createdDate(), req.closedDate());
        return IncidentDetailResponse.from(repository.saveAndFlush(incident));
    }

    @Transactional
    public void delete(String incidentNumber) {
        repository.delete(find(incidentNumber));
    }

    private Incident find(String incidentNumber) {
        String number = incidentNumber.trim().toUpperCase();
        return repository.findByIncidentNumber(number)
                .orElseThrow(() -> new IncidentNotFoundException(number));
    }

    /**
     * Business rules shared by create and update:
     * - a CLOSED incident must have a detailed analysis; its close date defaults to today
     * - a non-closed incident has no close date
     * - close date cannot be before the creation date
     */
    private static void apply(Incident incident, IncidentStatus status, String description,
                              String detailedAnalysis, LocalDate createdDate, LocalDate closedDate) {
        String analysis = (detailedAnalysis == null || detailedAnalysis.isBlank()) ? null : detailedAnalysis.trim();

        if (status.isClosed()) {
            if (analysis == null) {
                throw new InvalidIncidentException("detailedAnalysis",
                        "Detailed analysis is required to close an incident");
            }
            if (closedDate == null) {
                closedDate = LocalDate.now();
            }
            if (closedDate.isBefore(createdDate)) {
                throw new InvalidIncidentException("closedDate",
                        "Date of close cannot be before the date of creation");
            }
        } else {
            closedDate = null;
        }

        incident.setStatus(status);
        incident.setDescription(description.trim());
        incident.setDetailedAnalysis(analysis);
        incident.setCreatedDate(createdDate);
        incident.setClosedDate(closedDate);
    }
}
