package com.eventix.common.events;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentFailedEvent(
    String orderId,
    BigDecimal amount,
    String reason,
    Instant failedAt,
    String traceId
) {}
