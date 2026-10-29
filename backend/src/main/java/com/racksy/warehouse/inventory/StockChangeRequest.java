package com.racksy.warehouse.inventory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record StockChangeRequest(
        @NotNull(message = "Quantity is required") @Positive(message = "Quantity must be a positive whole number") Integer quantity,
        @Size(max = 120, message = "Note must be 120 characters or fewer") String note) { }
