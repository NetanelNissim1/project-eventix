package com.eventix.payment.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.dto.OrderItemDto;
import com.eventix.common.events.InventoryReservedEvent;
import com.eventix.payment.service.PaymentService;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventListener {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventListener.class);

    private final PaymentService paymentService;

    public PaymentEventListener(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_RESERVED, groupId = "payment-service-group")
    public void onInventoryReserved(InventoryReservedEvent event) {
        log.info("Received InventoryReservedEvent for order: {}. Calculating total...", event.orderId());

        BigDecimal totalAmount = event.items().stream()
            .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        paymentService.processPayment(event.orderId(), totalAmount, event.traceId());
    }
}
