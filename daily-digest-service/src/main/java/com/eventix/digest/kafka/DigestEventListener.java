package com.eventix.digest.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.AuditEvent;
import com.eventix.common.events.AuditLevel;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.OrderCreatedEvent;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.digest.dto.CustomerPurchaseSummary;
import com.eventix.digest.service.DailyDigestService;
import java.util.ArrayList;
import java.util.List;
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
        log.info("DigestEventListener: OrderCreatedEvent received for orderId={}, customerEmail={}", event.orderId(), event.customerEmail());
        digestService.recordOrderCreated(event.totalAmount());

        List<CustomerPurchaseSummary.ItemSummary> itemSummaries = new ArrayList<>();
        if (event.items() != null) {
            for (var item : event.items()) {
                itemSummaries.add(new CustomerPurchaseSummary.ItemSummary(
                    item.productId(),
                    item.productName(),
                    item.quantity(),
                    item.unitPrice()
                ));
            }
        }

        CustomerPurchaseSummary purchaseSummary = new CustomerPurchaseSummary(
            event.orderId(),
            event.customerId(),
            event.customerEmail(),
            itemSummaries,
            event.totalAmount(),
            event.status() != null ? event.status() : "PENDING",
            event.createdAt() != null ? event.createdAt() : java.time.Instant.now()
        );
        digestService.recordCustomerOrder(purchaseSummary);

        digestService.recordCustomerActivity(
            event.customerEmail(),
            "ORDER_PLACED",
            "Placed Order #" + (event.orderId().length() > 8 ? event.orderId().substring(0, 8) : event.orderId()) + " for $" + event.totalAmount()
        );
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_COMPLETED, groupId = "digest-service-group")
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("DigestEventListener: PaymentCompletedEvent received for orderId={}", event.orderId());
        digestService.recordOrderConfirmed(event.amount());
        digestService.updateCustomerOrderStatus(event.orderId(), "CONFIRMED");
        digestService.recordCustomerActivity(
            null,
            "PAYMENT_CONFIRMED",
            "Payment verified for Order #" + (event.orderId().length() > 8 ? event.orderId().substring(0, 8) : event.orderId()) + " ($" + event.amount() + ")"
        );
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_FAILED, groupId = "digest-service-group")
    public void onPaymentFailed(PaymentFailedEvent event) {
        log.warn("DigestEventListener: PaymentFailedEvent received for orderId={}", event.orderId());
        digestService.recordOrderFailed();
        digestService.updateCustomerOrderStatus(event.orderId(), "PAYMENT_FAILED");
        digestService.recordCustomerActivity(
            null,
            "PAYMENT_FAILED",
            "Payment failed for Order #" + (event.orderId().length() > 8 ? event.orderId().substring(0, 8) : event.orderId()) + ": " + event.reason()
        );
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_FAILED, groupId = "digest-service-group")
    public void onInventoryFailed(InventoryFailedEvent event) {
        log.warn("DigestEventListener: InventoryFailedEvent received for orderId={}", event.orderId());
        digestService.recordOrderFailed();
        digestService.updateCustomerOrderStatus(event.orderId(), "INVENTORY_OUT_OF_STOCK");
        digestService.recordCustomerActivity(
            null,
            "INVENTORY_DEPLETED",
            "Stock unavailable for Order #" + (event.orderId().length() > 8 ? event.orderId().substring(0, 8) : event.orderId()) + ": " + event.reason()
        );
    }

    @KafkaListener(topics = KafkaTopics.SYSTEM_AUDIT_EVENTS, groupId = "digest-service-group")
    public void onAuditEvent(AuditEvent event) {
        if (event.level() == AuditLevel.ERROR || event.level() == AuditLevel.SECURITY_ALERT) {
            digestService.recordSystemIssue(true);
        } else if (event.level() == AuditLevel.WARNING) {
            digestService.recordSystemIssue(false);
        }

        if ("SEARCH".equalsIgnoreCase(event.action()) || "CUSTOMER_SEARCH".equalsIgnoreCase(event.action())) {
            digestService.recordCustomerSearch(event.details());
        } else {
            digestService.recordCustomerActivity(event.userId(), event.action(), event.details());
        }
    }
}
