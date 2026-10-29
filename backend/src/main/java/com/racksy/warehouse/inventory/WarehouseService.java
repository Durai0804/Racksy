package com.racksy.warehouse.inventory;

import com.racksy.warehouse.movement.MovementType;
import com.racksy.warehouse.movement.StockMovement;
import com.racksy.warehouse.movement.StockMovementDto;
import com.racksy.warehouse.movement.StockMovementRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WarehouseService {
    private final ContainerRepository containerRepository;
    private final StockMovementRepository movementRepository;

    public WarehouseService(ContainerRepository containerRepository, StockMovementRepository movementRepository) {
        this.containerRepository = containerRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional(readOnly = true)
    public List<ContainerDto> listContainers() {
        return containerRepository.findAll(Sort.by(Sort.Direction.ASC, "shelfId")).stream().map(ContainerDto::from).toList();
    }

    @Transactional(readOnly = true)
    public ContainerDto getContainer(String shelfId) {
        return ContainerDto.from(containerRepository.findById(shelfId).orElseThrow(() -> new InventoryNotFoundException(shelfId)));
    }

    @Transactional(readOnly = true)
    public List<StockMovementDto> getMovements(String shelfId) {
        if (!containerRepository.existsById(shelfId)) throw new InventoryNotFoundException(shelfId);
        return movementRepository.findTop50ByContainer_ShelfIdOrderByOccurredAtDescIdDesc(shelfId).stream().map(StockMovementDto::from).toList();
    }

    @Transactional
    public ContainerDto adjustStock(String shelfId, MovementType type, StockChangeRequest request) {
        InventoryContainer container = containerRepository.findForUpdate(shelfId).orElseThrow(() -> new InventoryNotFoundException(shelfId));
        int quantity = request.quantity();
        int current = container.getCurrentStock();
        int next;
        if (type == MovementType.ADD) {
            if (quantity > container.getMaxCapacity() - current) {
                throw new InventoryConflictException("Cannot add " + quantity + " units. Only " + (container.getMaxCapacity() - current) + " units of capacity remain.");
            }
            next = current + quantity;
        } else {
            if (quantity > current) {
                throw new InventoryConflictException("Cannot remove " + quantity + " units. Only " + current + " units are in stock.");
            }
            next = current - quantity;
        }

        Instant now = Instant.now();
        container.setCurrentStock(next, now);
        containerRepository.save(container);
        movementRepository.save(new StockMovement(container, type, quantity, next, request.note(), now));
        return ContainerDto.from(container);
    }
}
