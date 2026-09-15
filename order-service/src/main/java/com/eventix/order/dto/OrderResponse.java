package com.eventix.order.dto;

import com.eventix.common.dto.OrderItemDto;
import com.eventix.order.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    String id,
    String customerId,
    String customerEmail,
    BigDecimal totalAmount,
    OrderStatus status,
    Instant createdAt,
    Instant updatedAt,
    List<OrderItemDto> items
) {}
