package com.incidentmanagement;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full stack (controller, service, JPA) against the in-memory H2 profile with its sample data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class IncidentH2IntegrationTest {

    @Autowired
    MockMvc mvc;

    @Test
    void sampleDataIsLoadedAndSearchable() throws Exception {
        mvc.perform(get("/api/incidents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        mvc.perform(get("/api/incidents/summary").param("search", "LOGIN"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].incidentNumber").value("INC-1002"));

        mvc.perform(get("/api/incidents/summary").param("status", "CLOSED"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].open").value(false));
    }

    @Test
    void createUpdateCloseReopenDelete() throws Exception {
        mvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"incidentNumber":"inc-h2-1","status":"OPEN","description":"H2 test","createdDate":"2026-09-28"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.incidentNumber").value("INC-H2-1"));

        mvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"incidentNumber":"INC-H2-1","status":"OPEN","description":"dup","createdDate":"2026-09-28"}
                                """))
                .andExpect(status().isConflict());

        mvc.perform(put("/api/incidents/INC-H2-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CLOSED","description":"H2 test","createdDate":"2026-09-28"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.detailedAnalysis").exists());

        mvc.perform(put("/api/incidents/INC-H2-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CLOSED","description":"H2 test","detailedAnalysis":"Root cause found","createdDate":"2026-09-28"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.open").value(false))
                .andExpect(jsonPath("$.closedDate").value(LocalDate.now().toString()));

        mvc.perform(put("/api/incidents/INC-H2-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"IN_PROGRESS","description":"H2 test","detailedAnalysis":"Reopened","createdDate":"2026-09-28","closedDate":"2026-09-29"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedDate").value(nullValue()));

        mvc.perform(delete("/api/incidents/INC-H2-1")).andExpect(status().isNoContent());
        mvc.perform(get("/api/incidents/INC-H2-1")).andExpect(status().isNotFound());
    }
}
