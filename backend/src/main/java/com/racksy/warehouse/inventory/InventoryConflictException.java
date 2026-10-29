package com.racksy.warehouse.inventory;

public class InventoryConflictException extends RuntimeException {
    public InventoryConflictException(String message) { super(message); }
}
