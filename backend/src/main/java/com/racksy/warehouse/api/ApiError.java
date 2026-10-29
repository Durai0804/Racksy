package com.racksy.warehouse.api;

import java.time.Instant;

public record ApiError(String title, String detail, Instant timestamp) {
    public static ApiError of(String title, String detail) { return new ApiError(title, detail, Instant.now()); }
}
