package com.eventix.common.events;

import java.time.Instant;

public record OrderStatusUpdateEvent(
    String orderId,
    String status,
    String message,
    Instant updatedAt
) {}
