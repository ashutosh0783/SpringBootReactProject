package com.incidentmanagement.controller;

import com.incidentmanagement.dto.IncidentDetailResponse;
import com.incidentmanagement.exception.IncidentNotFoundException;
import com.incidentmanagement.exception.InvalidIncidentException;
import com.incidentmanagement.model.IncidentStatus;
import com.incidentmanagement.service.IncidentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IncidentController.class)
@TestPropertySource(properties = "app.cors.allowed-origins=http://localhost:5173")
class IncidentControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    IncidentService service;

    private static IncidentDetailResponse sample() {
        return new IncidentDetailResponse(1L, "INC-1", IncidentStatus.OPEN, true, "desc", null,
                LocalDate.of(2026, 9, 1), null, null, null);
    }

    @Test
    void getDetailsReturnsIncident() throws Exception {
        when(service.getDetails("INC-1")).thenReturn(sample());

        mvc.perform(get("/api/incidents/INC-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentNumber").value("INC-1"))
                .andExpect(jsonPath("$.createdDate").value("2026-09-01"));
    }

    @Test
    void getDetailsUnknownReturns404() throws Exception {
        when(service.getDetails("NOPE")).thenThrow(new IncidentNotFoundException("NOPE"));

        mvc.perform(get("/api/incidents/NOPE"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createReturns201WithLocation() throws Exception {
        when(service.create(any())).thenReturn(sample());

        mvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"incidentNumber":"INC-1","status":"OPEN","description":"desc","createdDate":"2026-09-01"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/incidents/INC-1"));
    }

    @Test
    void createWithMissingFieldsReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.incidentNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.status").exists())
                .andExpect(jsonPath("$.fieldErrors.createdDate").exists());
    }

    @Test
    void closingWithoutAnalysisReturns400() throws Exception {
        when(service.update(eq("INC-1"), any()))
                .thenThrow(new InvalidIncidentException("detailedAnalysis", "required"));

        mvc.perform(put("/api/incidents/INC-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CLOSED","description":"desc","createdDate":"2026-09-01"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.detailedAnalysis").value("required"));
    }

    @Test
    void deleteReturns204AndUnknownReturns404() throws Exception {
        mvc.perform(delete("/api/incidents/INC-1")).andExpect(status().isNoContent());

        doThrow(new IncidentNotFoundException("X")).when(service).delete("X");
        mvc.perform(delete("/api/incidents/X")).andExpect(status().isNotFound());
    }
}
