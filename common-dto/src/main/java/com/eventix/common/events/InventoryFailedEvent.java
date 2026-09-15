package com.eventix.common.events;

import java.time.Instant;

public record InventoryFailedEvent(
    String orderId,
    String reason,
    Instant failedAt,
    String traceId
) {}
