package com.eventix.common.events;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentCompletedEvent(
    String orderId,
    String paymentId,
    BigDecimal amount,
    Instant completedAt,
    String traceId
) {}
