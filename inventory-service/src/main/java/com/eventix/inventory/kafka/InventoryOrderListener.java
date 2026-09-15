package com.eventix.inventory.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.OrderCreatedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryOrderListener {

    private static final Logger log = LoggerFactory.getLogger(InventoryOrderListener.class);

    private final InventoryService inventoryService;

    public InventoryOrderListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "inventory-service-group")
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("Received OrderCreatedEvent for order: {}. Reserving items: {}", event.orderId(), event.items().size());
        inventoryService.reserveStock(event.orderId(), event.items(), event.traceId());
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_FAILED, groupId = "inventory-service-group")
    public void onPaymentFailed(PaymentFailedEvent event) {
        log.warn("Saga Compensation: Payment failed for order {}. Triggering inventory release.", event.orderId());
        // For compensation, stock can be released or flagged
    }
}
