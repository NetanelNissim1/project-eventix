package com.eventix.inventory.config;

import com.eventix.inventory.entity.InventoryItem;
import com.eventix.inventory.repository.InventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InventoryDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(InventoryDataInitializer.class);

    @Bean
    public CommandLineRunner seedInventory(InventoryRepository inventoryRepository) {
        return args -> {
            if (inventoryRepository.count() > 0) {
                return;
            }
            log.info("Seeding initial inventory stock for Project Eventix...");

            inventoryRepository.save(new InventoryItem("prod-101", "Sony WH-1000XM5 Wireless Headphones", 50, 0));
            inventoryRepository.save(new InventoryItem("prod-102", "Apple MacBook Pro 16\" M3 Max", 25, 0));
            inventoryRepository.save(new InventoryItem("prod-103", "Keychron Q1 Pro Mechanical Keyboard", 60, 0));
            inventoryRepository.save(new InventoryItem("prod-104", "Logitech MX Master 3S Wireless Mouse", 80, 0));
            inventoryRepository.save(new InventoryItem("prod-105", "Dell UltraSharp 32\" 4K USB-C Hub Monitor", 30, 0));
            inventoryRepository.save(new InventoryItem("prod-106", "Anker 737 Power Bank (PowerCore 24K)", 100, 0));

            log.info("Finished seeding inventory stock for all catalog products.");
        };
    }
}
