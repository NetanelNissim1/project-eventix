package com.eventix.digest.dto;

import java.time.Instant;

public record CustomerActivitySummary(
    String id,
    String customerEmail,
    String action,
    String details,
    Instant timestamp
) {}
