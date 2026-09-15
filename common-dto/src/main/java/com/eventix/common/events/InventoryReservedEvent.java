package com.eventix.common.events;

import com.eventix.common.dto.OrderItemDto;
import java.time.Instant;
import java.util.List;

public record InventoryReservedEvent(
    String orderId,
    List<OrderItemDto> items,
    Instant reservedAt,
    String traceId
) {}
