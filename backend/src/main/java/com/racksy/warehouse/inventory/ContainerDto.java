package com.racksy.warehouse.inventory;

import com.racksy.warehouse.product.ProductDto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

public record ContainerDto(
        String shelfId,
        String columnCode,
        int level,
        ProductDto product,
        int currentStock,
        int maxCapacity,
        BigDecimal occupancyPercentage,
        int availableCapacity,
        StockStatus status,
        Instant updatedAt) {

    public static ContainerDto from(InventoryContainer container) {
        BigDecimal occupancy = BigDecimal.valueOf(container.getCurrentStock())
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(container.getMaxCapacity()), 1, RoundingMode.HALF_UP);
        return new ContainerDto(
                container.getShelfId(), container.getColumnCode(), container.getLevel(),
                ProductDto.from(container.getProduct()), container.getCurrentStock(), container.getMaxCapacity(),
                occupancy, container.getMaxCapacity() - container.getCurrentStock(),
                statusFor(container.getCurrentStock(), occupancy), container.getUpdatedAt());
    }

    private static StockStatus statusFor(int currentStock, BigDecimal occupancy) {
        if (currentStock == 0) return StockStatus.EMPTY;
        if (occupancy.compareTo(BigDecimal.valueOf(90)) >= 0) return StockStatus.CRITICAL;
        if (occupancy.compareTo(BigDecimal.valueOf(78)) >= 0) return StockStatus.NEAR_CAPACITY;
        if (occupancy.compareTo(BigDecimal.valueOf(30)) <= 0) return StockStatus.LOW;
        return StockStatus.NORMAL;
    }
}
