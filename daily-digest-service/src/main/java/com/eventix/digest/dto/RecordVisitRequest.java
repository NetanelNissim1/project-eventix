package com.eventix.digest.dto;

public record RecordVisitRequest(
    String sessionId,
    String page,
    String customerEmail
) {}
