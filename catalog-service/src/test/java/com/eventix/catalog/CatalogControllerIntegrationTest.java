package com.eventix.catalog;

import com.eventix.catalog.controller.CatalogController;
import com.eventix.catalog.entity.CategoryEntity;
import com.eventix.catalog.entity.ProductEntity;
import com.eventix.catalog.service.CatalogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CatalogController Integration Tests - Product & Category Endpoints")
class CatalogControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private CatalogService catalogService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        CatalogController controller = new CatalogController(catalogService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/v1/products - Returns 200 OK with product list")
    void testGetProductsReturns200() throws Exception {
        CategoryEntity cat = new CategoryEntity("cat-1", "Electronics", "Gadgets");
        ProductEntity prod = new ProductEntity(
            "prod-1", "Sony WH-1000XM5", "Noise Cancelling", new BigDecimal("349.99"), "img.jpg", cat, Instant.now()
        );
        when(catalogService.getAllProducts()).thenReturn(List.of(prod));

        mockMvc.perform(get("/api/v1/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("prod-1"))
            .andExpect(jsonPath("$[0].name").value("Sony WH-1000XM5"))
            .andExpect(jsonPath("$[0].price").value(349.99));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} - Returns 200 when found, 404 when absent")
    void testGetProductById() throws Exception {
        CategoryEntity cat = new CategoryEntity("cat-1", "Electronics", "Gadgets");
        ProductEntity prod = new ProductEntity(
            "prod-1", "Bose QC Ultra", "Headphones", new BigDecimal("429.00"), "img.jpg", cat, Instant.now()
        );
        when(catalogService.getProductById("prod-1")).thenReturn(Optional.of(prod));
        when(catalogService.getProductById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/products/prod-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("prod-1"))
            .andExpect(jsonPath("$.name").value("Bose QC Ultra"));

        mockMvc.perform(get("/api/v1/products/non-existent"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/categories - Returns 200 OK with categories")
    void testGetCategories() throws Exception {
        CategoryEntity cat = new CategoryEntity("cat-electronics", "Electronics", "Gadgets");
        when(catalogService.getAllCategories()).thenReturn(List.of(cat));

        mockMvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("cat-electronics"))
            .andExpect(jsonPath("$[0].name").value("Electronics"));
    }

    @Test
    @DisplayName("POST /api/v1/products - Creates and returns product")
    void testCreateProduct() throws Exception {
        CategoryEntity cat = new CategoryEntity("cat-acc", "Accessories", "Peripherals");
        ProductEntity newProd = new ProductEntity("prod-new", "Keychron Q1", "Keyboard", new BigDecimal("199.00"), "img.jpg", cat, Instant.now());
        when(catalogService.saveProduct(any(ProductEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProd)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("prod-new"))
            .andExpect(jsonPath("$.name").value("Keychron Q1"));
    }

    @Test
    @DisplayName("DELETE /api/v1/products/{id} - Returns 204 No Content")
    void testDeleteProduct() throws Exception {
        mockMvc.perform(delete("/api/v1/products/prod-123"))
            .andExpect(status().isNoContent());

        verify(catalogService).deleteProduct("prod-123");
    }
}
