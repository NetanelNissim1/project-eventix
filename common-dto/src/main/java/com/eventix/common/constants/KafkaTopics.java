package com.eventix.common.constants;

public final class KafkaTopics {
    private KafkaTopics() {}

    public static final String ORDER_CREATED = "order-created-events";
    public static final String INVENTORY_RESERVED = "inventory-reserved-events";
    public static final String INVENTORY_FAILED = "inventory-failed-events";
    public static final String PAYMENT_COMPLETED = "payment-completed-events";
    public static final String PAYMENT_FAILED = "payment-failed-events";
    public static final String ORDER_STATUS_UPDATES = "order-status-updates";
    public static final String SYSTEM_AUDIT_EVENTS = "system-audit-events";
}
