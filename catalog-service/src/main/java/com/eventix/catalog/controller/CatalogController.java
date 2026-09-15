package com.eventix.catalog.controller;

import com.eventix.catalog.entity.CategoryEntity;
import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.service.CatalogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductEntity>> getProducts() {
        return ResponseEntity.ok(catalogService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductEntity> getProduct(@PathVariable String id) {
        return catalogService.getProductById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryEntity>> getCategories() {
        return ResponseEntity.ok(catalogService.getAllCategories());
    }

    @PostMapping("/products")
    public ResponseEntity<ProductEntity> createProduct(@RequestBody ProductEntity product) {
        return ResponseEntity.ok(catalogService.saveProduct(product));
    }
}
