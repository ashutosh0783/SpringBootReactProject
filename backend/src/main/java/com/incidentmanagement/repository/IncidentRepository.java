package com.incidentmanagement.repository;

import com.incidentmanagement.model.Incident;
import com.incidentmanagement.model.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Optional<Incident> findByIncidentNumber(String incidentNumber);

    boolean existsByIncidentNumber(String incidentNumber);

    /**
     * Search by free text (incident number or description) and/or status.
     * Null parameters are ignored.
     */
    @Query("""
            SELECT i FROM Incident i
            WHERE (:status IS NULL OR i.status = :status)
              AND (:text IS NULL
                   OR LOWER(i.incidentNumber) LIKE LOWER(CONCAT('%', :text, '%'))
                   OR LOWER(i.description) LIKE LOWER(CONCAT('%', :text, '%')))
            ORDER BY i.createdDate DESC, i.id DESC
            """)
    List<Incident> search(@Param("text") String text, @Param("status") IncidentStatus status);
}
