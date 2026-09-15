package com.eventix.catalog.config;

import com.eventix.catalog.entity.CategoryEntity;
import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.repository.CategoryRepository;
import com.eventix.catalog.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner seedCatalog(ProductRepository productRepo, CategoryRepository categoryRepo) {
        return args -> {
            if (productRepo.count() > 0) {
                return;
            }
            log.info("Seeding initial catalog categories and products...");

            CategoryEntity electronics = categoryRepo.save(new CategoryEntity("cat-electronics", "Electronics", "Gadgets & Hardware"));
            CategoryEntity accessories = categoryRepo.save(new CategoryEntity("cat-accessories", "Accessories", "Peripherals & Add-ons"));

            productRepo.save(new ProductEntity(
                "prod-101",
                "Sony WH-1000XM5 Wireless Headphones",
                "Industry-leading noise canceling headphones with dual processors and 8 microphones.",
                new BigDecimal("349.99"),
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
                electronics,
                Instant.now()
            ));

            productRepo.save(new ProductEntity(
                "prod-102",
                "Apple MacBook Pro 16\" M3 Max",
                "Supercharged with M3 Max chip, 36GB Unified Memory, and Liquid Retina XDR display.",
                new BigDecimal("2999.00"),
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
                electronics,
                Instant.now()
            ));

            productRepo.save(new ProductEntity(
                "prod-103",
                "Keychron Q1 Pro Mechanical Keyboard",
                "Wireless custom mechanical keyboard with CNC aluminum body and hot-swappable switches.",
                new BigDecimal("199.00"),
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
                accessories,
                Instant.now()
            ));

            productRepo.save(new ProductEntity(
                "prod-104",
                "Logitech MX Master 3S Wireless Mouse",
                "Quiet clicks, 8K DPI tracking on glass, and ergonomic sculpted design.",
                new BigDecimal("99.99"),
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80",
                accessories,
                Instant.now()
            ));

            log.info("Finished seeding catalog products.");
        };
    }
}
