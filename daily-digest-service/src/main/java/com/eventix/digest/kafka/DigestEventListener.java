package com.eventix.digest.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.AuditEvent;
import com.eventix.common.events.AuditLevel;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.OrderCreatedEvent;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.digest.service.DailyDigestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DigestEventListener {

    private static final Logger log = LoggerFactory.getLogger(DigestEventListener.class);

    private final DailyDigestService digestService;

    public DigestEventListener(DailyDigestService digestService) {
        this.digestService = digestService;
    }

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "digest-service-group")
    public void onOrderCreated(OrderCreatedEvent event) {
        digestService.recordOrderCreated(event.totalAmount());
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_COMPLETED, groupId = "digest-service-group")
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        digestService.recordOrderConfirmed(event.amount());
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_FAILED, groupId = "digest-service-group")
    public void onPaymentFailed(PaymentFailedEvent event) {
        digestService.recordOrderFailed();
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_FAILED, groupId = "digest-service-group")
    public void onInventoryFailed(InventoryFailedEvent event) {
        digestService.recordOrderFailed();
    }

    @KafkaListener(topics = KafkaTopics.SYSTEM_AUDIT_EVENTS, groupId = "digest-service-group")
    public void onAuditEvent(AuditEvent event) {
        if (event.level() == AuditLevel.ERROR || event.level() == AuditLevel.SECURITY_ALERT) {
            digestService.recordSystemIssue(true);
        } else if (event.level() == AuditLevel.WARNING) {
            digestService.recordSystemIssue(false);
        }
    }
}
