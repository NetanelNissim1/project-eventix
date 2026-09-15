package com.eventix.catalog.service;

import com.eventix.catalog.entity.CategoryEntity;
import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.repository.CategoryRepository;
import com.eventix.catalog.repository.ProductRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {

    private static final Logger log = LoggerFactory.getLogger(CatalogService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public CatalogService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Cacheable(value = "product-list")
    @Transactional(readOnly = true)
    public List<ProductEntity> getAllProducts() {
        log.info("Fetching all products from DB (Cache miss)");
        return productRepository.findAll();
    }

    @Cacheable(value = "products", key = "#id")
    @Transactional(readOnly = true)
    public Optional<ProductEntity> getProductById(String id) {
        log.info("Fetching product {} from DB (Cache miss)", id);
        return productRepository.findById(id);
    }

    @Cacheable(value = "categories")
    @Transactional(readOnly = true)
    public List<CategoryEntity> getAllCategories() {
        return categoryRepository.findAll();
    }

    @CacheEvict(value = {"products", "product-list"}, allEntries = true)
    @Transactional
    public ProductEntity saveProduct(ProductEntity product) {
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(Instant.now());
        }
        log.info("Saving product {} and evicting Redis cache", product.getId());
        return productRepository.save(product);
    }

    @Transactional
    public CategoryEntity saveCategory(CategoryEntity category) {
        return categoryRepository.save(category);
    }
}
