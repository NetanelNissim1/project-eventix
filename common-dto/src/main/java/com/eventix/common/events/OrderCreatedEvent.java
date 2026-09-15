package com.eventix.common.events;

import com.eventix.common.dto.OrderItemDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderCreatedEvent(
    String orderId,
    String customerId,
    String customerEmail,
    List<OrderItemDto> items,
    BigDecimal totalAmount,
    String status,
    Instant createdAt,
    String traceId
) {}
