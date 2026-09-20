package com.eventix.digest.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CustomerPurchaseSummary(
    String orderId,
    String customerId,
    String customerEmail,
    List<ItemSummary> items,
    BigDecimal totalAmount,
    String status,
    Instant createdAt
) {
    public record ItemSummary(
        String productId,
        String productName,
        int quantity,
        BigDecimal unitPrice
    ) {}
}
