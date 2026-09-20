package com.eventix.catalog;

import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.repository.CategoryRepository;
import com.eventix.catalog.repository.ProductRepository;
import com.eventix.catalog.service.CatalogService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private CatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogService(productRepository, categoryRepository);
    }

    @Test
    void testGetAllProducts() {
        ProductEntity prod = new ProductEntity("prod-101", "Test Product", "Desc", new BigDecimal("99.99"), null, null, Instant.now());
        when(productRepository.findAll()).thenReturn(List.of(prod));

        List<ProductEntity> result = catalogService.getAllProducts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Product");
    }

    @Test
    void testSaveProductSetsCreatedAtAndSaves() {
        ProductEntity prod = new ProductEntity();
        prod.setId("prod-102");
        prod.setName("New Product");
        prod.setPrice(new BigDecimal("49.99"));

        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductEntity saved = catalogService.saveProduct(prod);

        assertThat(saved).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        verify(productRepository).save(prod);
    }

    @Test
    void testDeleteProductCallsRepository() {
        catalogService.deleteProduct("prod-101");

        verify(productRepository).deleteById("prod-101");
    }
}
