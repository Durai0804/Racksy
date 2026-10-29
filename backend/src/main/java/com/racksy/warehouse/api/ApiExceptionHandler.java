package com.racksy.warehouse.api;

import com.racksy.warehouse.inventory.InventoryConflictException;
import com.racksy.warehouse.inventory.InventoryNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<ApiError> notFound(InventoryNotFoundException error) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("Container not found", error.getMessage()));
    }

    @ExceptionHandler(InventoryConflictException.class)
    public ResponseEntity<ApiError> conflict(InventoryConflictException error) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of("Stock update rejected", error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalidRequest(MethodArgumentNotValidException error) {
        String detail = error.getBindingResult().getFieldErrors().stream().findFirst()
                .map(fieldError -> fieldError.getDefaultMessage() == null ? "Request validation failed." : fieldError.getDefaultMessage())
                .orElse("Request validation failed.");
        return ResponseEntity.badRequest().body(ApiError.of("Invalid stock request", detail));
    }
}
