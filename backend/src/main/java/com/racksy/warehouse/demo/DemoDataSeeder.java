package com.racksy.warehouse.demo;

import com.racksy.warehouse.inventory.ContainerRepository;
import com.racksy.warehouse.inventory.InventoryContainer;
import com.racksy.warehouse.movement.MovementType;
import com.racksy.warehouse.movement.StockMovement;
import com.racksy.warehouse.movement.StockMovementRepository;
import com.racksy.warehouse.product.Product;
import com.racksy.warehouse.product.ProductRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile({"demo", "demo-postgres", "test"})
public class DemoDataSeeder implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final ContainerRepository containerRepository;
    private final StockMovementRepository movementRepository;

    public DemoDataSeeder(ProductRepository productRepository, ContainerRepository containerRepository, StockMovementRepository movementRepository) {
        this.productRepository = productRepository;
        this.containerRepository = containerRepository;
        this.movementRepository = movementRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (containerRepository.count() > 0) return;
        List<DemoContainer> records = List.of(
                new DemoContainer("A-01", 1, "WM-001", "Wireless Mouse", "Electronics", 25),
                new DemoContainer("A-01", 2, "KB-024", "Mechanical Keyboard", "Peripherals", 44),
                new DemoContainer("A-01", 3, "DK-014", "USB-C Docking Station", "Peripherals", 72),
                new DemoContainer("A-02", 1, "HP-102", "Wireless Headphones", "Audio", 18),
                new DemoContainer("A-02", 2, "WC-118", "HD Webcam", "Electronics", 33),
                new DemoContainer("A-02", 3, "MN-270", "27-inch Monitor", "Displays", 82),
                new DemoContainer("A-03", 1, "LS-440", "Aluminum Laptop Stand", "Accessories", 56),
                new DemoContainer("A-03", 2, "LAP-001", "Laptop", "Computers", 60),
                new DemoContainer("A-03", 3, "TB-220", "Business Tablet", "Computers", 38),
                new DemoContainer("A-04", 1, "SSD-004", "Portable SSD 2 TB", "Storage", 91),
                new DemoContainer("A-04", 2, "MM-016", "DDR5 Memory Kit", "Components", 47),
                new DemoContainer("A-04", 3, "GC-308", "Graphics Card", "Components", 74),
                new DemoContainer("A-05", 1, "PC-830", "Portable Charger", "Power", 24),
                new DemoContainer("A-05", 2, "RT-150", "Wi-Fi 7 Router", "Networking", 67),
                new DemoContainer("A-05", 3, "SS-059", "Smart Speaker", "Audio", 0));

        Instant now = Instant.now();
        for (DemoContainer record : records) {
            int level = record.level();
            String shelfId = record.columnCode() + "-L" + level;
            Product product = productRepository.save(new Product(record.sku(), record.productName(), record.category()));
            InventoryContainer container = containerRepository.save(new InventoryContainer(shelfId, record.columnCode(), level, product, record.stock(), 100, now));
            if (record.stock() > 0) {
                movementRepository.save(new StockMovement(container, MovementType.ADD, record.stock(), record.stock(), "Demo opening balance", now.minus(2, ChronoUnit.DAYS)));
            }
        }
    }

    private record DemoContainer(String columnCode, int level, String sku, String productName, String category, int stock) { }
}
