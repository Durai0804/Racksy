package com.racksy.warehouse.movement;

import com.racksy.warehouse.inventory.InventoryContainer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "stock_movements")
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "container_id", nullable = false)
    private InventoryContainer container;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 8)
    private MovementType type;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "resulting_stock", nullable = false)
    private int resultingStock;

    @Column(length = 120)
    private String note;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected StockMovement() { }

    public StockMovement(InventoryContainer container, MovementType type, int quantity, int resultingStock, String note, Instant occurredAt) {
        this.container = container;
        this.type = type;
        this.quantity = quantity;
        this.resultingStock = resultingStock;
        this.note = note;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public InventoryContainer getContainer() { return container; }
    public MovementType getType() { return type; }
    public int getQuantity() { return quantity; }
    public int getResultingStock() { return resultingStock; }
    public String getNote() { return note; }
    public Instant getOccurredAt() { return occurredAt; }
}
