package com.eventix.common.events;

import java.time.Instant;

public record AuditEvent(
    String id,
    Instant timestamp,
    String serviceName,
    String traceId,
    String userId,
    String clientIp,
    AuditLevel level,
    String action,
    String details,
    String errorDetails
) {}
