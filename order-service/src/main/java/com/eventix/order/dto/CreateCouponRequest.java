package com.eventix.order.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateCouponRequest(
    @NotBlank(message = "Coupon code is required")
    String code,

    String description,

    @NotNull(message = "Discount percent is required")
    @DecimalMin(value = "0.00", message = "Discount cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount cannot exceed 100%")
    BigDecimal discountPercent
) {}
