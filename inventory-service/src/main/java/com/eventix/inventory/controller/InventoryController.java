package com.eventix.inventory.controller;

import com.eventix.inventory.entity.InventoryItem;
import com.eventix.inventory.service.InventoryService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getStock() {
        return ResponseEntity.ok(inventoryService.getAllStock());
    }

    @PostMapping("/restock")
    public ResponseEntity<InventoryItem> restock(
        @RequestParam @NotBlank String productId,
        @RequestParam @NotBlank String productName,
        @RequestParam @Min(1) int quantity
    ) {
        return ResponseEntity.ok(inventoryService.addOrUpdateStock(productId, productName, quantity));
    }
}
