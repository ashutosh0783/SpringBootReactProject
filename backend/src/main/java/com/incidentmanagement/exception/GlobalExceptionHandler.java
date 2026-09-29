package com.incidentmanagement.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Returns RFC 7807 problem details. Validation errors carry a "fieldErrors" map
 * so the UI can show messages next to the right inputs.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IncidentNotFoundException.class)
    public ProblemDetail handleNotFound(IncidentNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Incident not found", ex.getMessage());
    }

    @ExceptionHandler(DuplicateIncidentException.class)
    public ProblemDetail handleDuplicate(DuplicateIncidentException ex) {
        ProblemDetail pd = problem(HttpStatus.CONFLICT, "Duplicate incident", ex.getMessage());
        pd.setProperty("fieldErrors", Map.of("incidentNumber", ex.getMessage()));
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleIntegrity(DataIntegrityViolationException ex) {
        return problem(HttpStatus.CONFLICT, "Data conflict",
                "The request conflicts with existing data (for example a duplicate incident number)");
    }

    @ExceptionHandler(InvalidIncidentException.class)
    public ProblemDetail handleInvalid(InvalidIncidentException ex) {
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation failed", ex.getMessage());
        pd.setProperty("fieldErrors", Map.of(ex.getField(), ex.getMessage()));
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation failed", "One or more fields are invalid");
        pd.setProperty("fieldErrors", fieldErrors);
        return pd;
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ProblemDetail handleUnreadable(Exception ex) {
        return problem(HttpStatus.BAD_REQUEST, "Malformed request",
                "Request contains an invalid value (check status and date formats, e.g. 2026-09-29)");
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        return pd;
    }
}
