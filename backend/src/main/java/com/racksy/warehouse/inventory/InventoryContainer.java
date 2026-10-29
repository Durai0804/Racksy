package com.racksy.warehouse.inventory;

import com.racksy.warehouse.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "inventory_containers")
public class InventoryContainer {
    @Id
    @Column(name = "shelf_id", length = 32)
    private String shelfId;

    @Column(name = "column_code", nullable = false, length = 12)
    private String columnCode;

    @Column(nullable = false)
    private int level;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "current_stock", nullable = false)
    private int currentStock;

    @Column(name = "max_capacity", nullable = false)
    private int maxCapacity;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected InventoryContainer() { }

    public InventoryContainer(String shelfId, String columnCode, int level, Product product, int currentStock, int maxCapacity, Instant updatedAt) {
        this.shelfId = shelfId;
        this.columnCode = columnCode;
        this.level = level;
        this.product = product;
        this.currentStock = currentStock;
        this.maxCapacity = maxCapacity;
        this.updatedAt = updatedAt;
    }

    public void setCurrentStock(int currentStock, Instant updatedAt) {
        this.currentStock = currentStock;
        this.updatedAt = updatedAt;
    }

    public String getShelfId() { return shelfId; }
    public String getColumnCode() { return columnCode; }
    public int getLevel() { return level; }
    public Product getProduct() { return product; }
    public int getCurrentStock() { return currentStock; }
    public int getMaxCapacity() { return maxCapacity; }
    public Instant getUpdatedAt() { return updatedAt; }
}
