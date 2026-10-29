package com.racksy.warehouse.inventory;

public class InventoryNotFoundException extends RuntimeException {
    public InventoryNotFoundException(String shelfId) { super("Container " + shelfId + " was not found."); }
}
