package com.racksy.warehouse.product;

public record ProductDto(String sku, String name, String category) {
    public static ProductDto from(Product product) {
        return new ProductDto(product.getSku(), product.getName(), product.getCategory());
    }
}
