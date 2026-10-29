package com.racksy.warehouse.movement;

import java.time.Instant;

public record StockMovementDto(Long id, MovementType type, int quantity, int resultingStock, String note, Instant occurredAt) {
    public static StockMovementDto from(StockMovement movement) {
        return new StockMovementDto(movement.getId(), movement.getType(), movement.getQuantity(), movement.getResultingStock(), movement.getNote(), movement.getOccurredAt());
    }
}
