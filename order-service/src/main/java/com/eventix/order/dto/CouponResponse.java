package com.eventix.order.dto;

import java.math.BigDecimal;

public record CouponResponse(
    String code,
    String description,
    BigDecimal discountPercent,
    boolean active,
    int usageCount
) {}
