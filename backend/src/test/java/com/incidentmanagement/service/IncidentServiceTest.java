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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    private static final LocalDate CREATED = LocalDate.of(2026, 9, 20);

    @Mock
    IncidentRepository repository;

    @InjectMocks
    IncidentService service;

    private static Incident incident(String number, IncidentStatus status, String analysis, LocalDate closedDate) {
        Incident i = new Incident();
        i.setIncidentNumber(number);
        i.setStatus(status);
        i.setDescription("desc " + number);
        i.setDetailedAnalysis(analysis);
        i.setCreatedDate(CREATED);
        i.setClosedDate(closedDate);
        return i;
    }

    private static CreateIncidentRequest createReq(String number, IncidentStatus status, String analysis, LocalDate closedDate) {
        return new CreateIncidentRequest(number, status, "Checkout failing", analysis, CREATED, closedDate);
    }

    private static UpdateIncidentRequest updateReq(IncidentStatus status, String analysis, LocalDate closedDate) {
        return new UpdateIncidentRequest(status, "Checkout failing", analysis, CREATED, closedDate);
    }

    @Nested
    @DisplayName("getAll")
    class GetAll {

        @Test
        void returnsAllIncidentsNewestFirstWithOpenFlag() {
            when(repository.findAll(any(Sort.class))).thenReturn(List.of(
                    incident("INC-2", IncidentStatus.OPEN, null, null),
                    incident("INC-1", IncidentStatus.CLOSED, "done", CREATED)));

            List<IncidentDetailResponse> result = service.getAll();

            assertThat(result).extracting(IncidentDetailResponse::incidentNumber).containsExactly("INC-2", "INC-1");
            assertThat(result).extracting(IncidentDetailResponse::open).containsExactly(true, false);

            ArgumentCaptor<Sort> sort = ArgumentCaptor.forClass(Sort.class);
            verify(repository).findAll(sort.capture());
            assertThat(sort.getValue()).isEqualTo(Sort.by(Sort.Order.desc("createdDate"), Sort.Order.desc("id")));
        }

        @Test
        void returnsEmptyListWhenNoIncidents() {
            when(repository.findAll(any(Sort.class))).thenReturn(List.of());

            assertThat(service.getAll()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getSummary")
    class GetSummary {

        @Test
        void trimsSearchTextAndPassesStatus() {
            when(repository.search("login", IncidentStatus.OPEN))
                    .thenReturn(List.of(incident("INC-1", IncidentStatus.OPEN, null, null)));

            List<IncidentSummaryResponse> result = service.getSummary("  login  ", IncidentStatus.OPEN);

            assertThat(result).singleElement().satisfies(s -> {
                assertThat(s.incidentNumber()).isEqualTo("INC-1");
                assertThat(s.open()).isTrue();
                assertThat(s.description()).isEqualTo("desc INC-1");
            });
        }

        @ParameterizedTest
        @NullSource
        @ValueSource(strings = {"", "   "})
        void treatsBlankSearchAsNoFilter(String search) {
            when(repository.search(null, null)).thenReturn(List.of());

            assertThat(service.getSummary(search, null)).isEmpty();
            verify(repository).search(null, null);
        }
    }

    @Nested
    @DisplayName("getDetails")
    class GetDetails {

        @Test
        void findsByNormalizedIncidentNumber() {
            when(repository.findByIncidentNumber("INC-7"))
                    .thenReturn(Optional.of(incident("INC-7", IncidentStatus.CLOSED, "analysis", CREATED)));

            IncidentDetailResponse result = service.getDetails("  inc-7 ");

            assertThat(result.incidentNumber()).isEqualTo("INC-7");
            assertThat(result.detailedAnalysis()).isEqualTo("analysis");
            assertThat(result.open()).isFalse();
        }

        @Test
        void throwsNotFoundForUnknownNumber() {
            when(repository.findByIncidentNumber("NOPE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getDetails("nope"))
                    .isInstanceOf(IncidentNotFoundException.class)
                    .hasMessageContaining("NOPE");
        }
    }

    @Nested
    @DisplayName("create")
    class Create {

        // An unstubbed existsByIncidentNumber returns false, i.e. the number is free.

        private Incident saved() {
            ArgumentCaptor<Incident> captor = ArgumentCaptor.forClass(Incident.class);
            verify(repository).save(captor.capture());
            return captor.getValue();
        }

        private void saveReturnsArgument() {
            when(repository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        void normalizesNumberAndTrimsText() {
            saveReturnsArgument();

            IncidentDetailResponse result = service.create(new CreateIncidentRequest(
                    "  inc-100 ", IncidentStatus.OPEN, "  Checkout failing  ", "  notes  ", CREATED, null));

            Incident s = saved();
            assertThat(s.getIncidentNumber()).isEqualTo("INC-100");
            assertThat(s.getDescription()).isEqualTo("Checkout failing");
            assertThat(s.getDetailedAnalysis()).isEqualTo("notes");
            assertThat(s.getCreatedDate()).isEqualTo(CREATED);
            assertThat(result.incidentNumber()).isEqualTo("INC-100");
            assertThat(result.open()).isTrue();
        }

        @Test
        void rejectsDuplicateNumberWithoutSaving() {
            when(repository.existsByIncidentNumber("INC-1")).thenReturn(true);

            assertThatThrownBy(() -> service.create(createReq("inc-1", IncidentStatus.OPEN, null, null)))
                    .isInstanceOf(DuplicateIncidentException.class)
                    .hasMessageContaining("INC-1");
            verify(repository, never()).save(any());
        }

        @ParameterizedTest
        @EnumSource(value = IncidentStatus.class, names = "CLOSED", mode = EnumSource.Mode.EXCLUDE)
        void nonClosedIncidentHasNoCloseDate(IncidentStatus status) {
            saveReturnsArgument();

            service.create(createReq("INC-1", status, null, LocalDate.of(2026, 9, 25)));

            Incident s = saved();
            assertThat(s.getStatus()).isEqualTo(status);
            assertThat(s.getClosedDate()).isNull();
        }

        @ParameterizedTest
        @NullSource
        @ValueSource(strings = {"", "   "})
        void blankAnalysisIsStoredAsNull(String analysis) {
            saveReturnsArgument();

            service.create(createReq("INC-1", IncidentStatus.OPEN, analysis, null));

            assertThat(saved().getDetailedAnalysis()).isNull();
        }

        @ParameterizedTest
        @NullSource
        @ValueSource(strings = {"", "   "})
        void closedIncidentRequiresAnalysis(String analysis) {
            assertThatThrownBy(() -> service.create(createReq("INC-1", IncidentStatus.CLOSED, analysis, CREATED)))
                    .isInstanceOf(InvalidIncidentException.class)
                    .hasFieldOrPropertyWithValue("field", "detailedAnalysis");
            verify(repository, never()).save(any());
        }

        @Test
        void closedIncidentWithoutCloseDateDefaultsToToday() {
            saveReturnsArgument();

            IncidentDetailResponse result = service.create(createReq("INC-1", IncidentStatus.CLOSED, "root cause", null));

            assertThat(saved().getClosedDate()).isEqualTo(LocalDate.now());
            assertThat(result.open()).isFalse();
        }

        @Test
        void closedIncidentKeepsGivenCloseDate() {
            saveReturnsArgument();
            LocalDate closed = LocalDate.of(2026, 9, 25);

            service.create(createReq("INC-1", IncidentStatus.CLOSED, "root cause", closed));

            assertThat(saved().getClosedDate()).isEqualTo(closed);
        }

        @Test
        void closeDateOnCreationDateIsAllowed() {
            saveReturnsArgument();

            service.create(createReq("INC-1", IncidentStatus.CLOSED, "root cause", CREATED));

            assertThat(saved().getClosedDate()).isEqualTo(CREATED);
        }

        @Test
        void closeDateBeforeCreationDateIsRejected() {
            assertThatThrownBy(() -> service.create(
                    createReq("INC-1", IncidentStatus.CLOSED, "root cause", CREATED.minusDays(1))))
                    .isInstanceOf(InvalidIncidentException.class)
                    .hasFieldOrPropertyWithValue("field", "closedDate");
            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("update")
    class Update {

        private Incident existing;

        @BeforeEach
        void existingOpenIncident() {
            existing = incident("INC-5", IncidentStatus.OPEN, null, null);
            when(repository.findByIncidentNumber("INC-5")).thenReturn(Optional.of(existing));
        }

        private void saveReturnsArgument() {
            when(repository.saveAndFlush(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        void updatesFieldsButKeepsIncidentNumber() {
            saveReturnsArgument();
            LocalDate newCreated = CREATED.minusDays(2);

            IncidentDetailResponse result = service.update("inc-5", new UpdateIncidentRequest(
                    IncidentStatus.IN_PROGRESS, " New description ", " Investigating ", newCreated, null));

            assertThat(existing.getIncidentNumber()).isEqualTo("INC-5");
            assertThat(existing.getStatus()).isEqualTo(IncidentStatus.IN_PROGRESS);
            assertThat(existing.getDescription()).isEqualTo("New description");
            assertThat(existing.getDetailedAnalysis()).isEqualTo("Investigating");
            assertThat(existing.getCreatedDate()).isEqualTo(newCreated);
            assertThat(result.incidentNumber()).isEqualTo("INC-5");
            verify(repository).saveAndFlush(existing);
        }

        @Test
        void closesIncidentWithAnalysis() {
            saveReturnsArgument();

            IncidentDetailResponse result = service.update("INC-5", updateReq(IncidentStatus.CLOSED, "Root cause found", null));

            assertThat(existing.getStatus()).isEqualTo(IncidentStatus.CLOSED);
            assertThat(existing.getClosedDate()).isEqualTo(LocalDate.now());
            assertThat(result.open()).isFalse();
        }

        @Test
        void closingWithoutAnalysisIsRejectedAndIncidentUnchanged() {
            assertThatThrownBy(() -> service.update("INC-5", updateReq(IncidentStatus.CLOSED, " ", null)))
                    .isInstanceOf(InvalidIncidentException.class)
                    .hasFieldOrPropertyWithValue("field", "detailedAnalysis");

            assertThat(existing.getStatus()).isEqualTo(IncidentStatus.OPEN);
            verify(repository, never()).saveAndFlush(any());
        }

        @Test
        void closeDateBeforeCreationDateIsRejected() {
            assertThatThrownBy(() -> service.update("INC-5",
                    updateReq(IncidentStatus.CLOSED, "analysis", CREATED.minusDays(1))))
                    .isInstanceOf(InvalidIncidentException.class)
                    .hasFieldOrPropertyWithValue("field", "closedDate");
            verify(repository, never()).saveAndFlush(any());
        }

        @Test
        void reopeningClearsCloseDate() {
            saveReturnsArgument();
            existing.setStatus(IncidentStatus.CLOSED);
            existing.setDetailedAnalysis("analysis");
            existing.setClosedDate(CREATED.plusDays(1));

            IncidentDetailResponse result = service.update("INC-5",
                    updateReq(IncidentStatus.IN_PROGRESS, "Reopened: issue came back", CREATED.plusDays(1)));

            assertThat(existing.getClosedDate()).isNull();
            assertThat(result.open()).isTrue();
        }
    }

    @Nested
    @DisplayName("update of unknown incident")
    class UpdateUnknown {

        @Test
        void throwsNotFoundAndSavesNothing() {
            when(repository.findByIncidentNumber("NOPE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.update("nope", updateReq(IncidentStatus.OPEN, null, null)))
                    .isInstanceOf(IncidentNotFoundException.class);
            verify(repository, never()).saveAndFlush(any());
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        void deletesExistingIncident() {
            Incident existing = incident("INC-9", IncidentStatus.OPEN, null, null);
            when(repository.findByIncidentNumber("INC-9")).thenReturn(Optional.of(existing));

            service.delete(" inc-9 ");

            verify(repository).delete(existing);
        }

        @Test
        void throwsNotFoundAndDeletesNothingForUnknownNumber() {
            when(repository.findByIncidentNumber("NOPE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete("NOPE"))
                    .isInstanceOf(IncidentNotFoundException.class);
            verify(repository, never()).delete(any());
        }
    }
}
