package com.eventix.common.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record OrderItemDto(
    @NotBlank(message = "Product ID is required")
    String productId,

    @NotBlank(message = "Product name is required")
    String productName,

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity,

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    BigDecimal unitPrice
) {}
