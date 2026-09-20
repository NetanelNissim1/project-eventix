package com.eventix.digest.dto;

public record RecordActivityRequest(
    String action,
    String customerEmail,
    String details
) {}
