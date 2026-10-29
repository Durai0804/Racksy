package com.racksy.warehouse.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 48)
    private String sku;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80)
    private String category;

    protected Product() { }

    public Product(String sku, String name, String category) {
        this.id = UUID.randomUUID();
        this.sku = sku;
        this.name = name;
        this.category = category;
    }

    public UUID getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getCategory() { return category; }
}
