package com.racksy.warehouse.api;

import com.racksy.warehouse.inventory.ContainerDto;
import com.racksy.warehouse.inventory.StockChangeRequest;
import com.racksy.warehouse.inventory.WarehouseService;
import com.racksy.warehouse.movement.MovementType;
import com.racksy.warehouse.movement.StockMovementDto;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warehouse/containers")
public class WarehouseController {
    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) { this.warehouseService = warehouseService; }

    @GetMapping
    public List<ContainerDto> listContainers() { return warehouseService.listContainers(); }

    @GetMapping("/{shelfId}")
    public ContainerDto getContainer(@PathVariable String shelfId) { return warehouseService.getContainer(shelfId); }

    @GetMapping("/{shelfId}/movements")
    public List<StockMovementDto> getMovements(@PathVariable String shelfId) { return warehouseService.getMovements(shelfId); }

    @PostMapping("/{shelfId}/stock/add")
    public ContainerDto addStock(@PathVariable String shelfId, @Valid @RequestBody StockChangeRequest request) {
        return warehouseService.adjustStock(shelfId, MovementType.ADD, request);
    }

    @PostMapping("/{shelfId}/stock/remove")
    public ContainerDto removeStock(@PathVariable String shelfId, @Valid @RequestBody StockChangeRequest request) {
        return warehouseService.adjustStock(shelfId, MovementType.REMOVE, request);
    }
}
