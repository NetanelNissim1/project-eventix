package com.eventix.order.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.OrderStatusUpdateEvent;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.service.OrderService;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderSagaListener {

    private static final Logger log = LoggerFactory.getLogger(OrderSagaListener.class);

    private final OrderService orderService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderSagaListener(OrderService orderService, KafkaTemplate<String, Object> kafkaTemplate) {
        this.orderService = orderService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_COMPLETED, groupId = "order-service-group")
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Saga: Payment completed for order {}. Confirming order.", event.orderId());
        orderService.updateOrderStatus(event.orderId(), OrderStatus.CONFIRMED, "Payment succeeded (PaymentId: " + event.paymentId() + ")");

        // Publish status update for notification-service / websocket
        OrderStatusUpdateEvent update = new OrderStatusUpdateEvent(
            event.orderId(),
            OrderStatus.CONFIRMED.name(),
            "Order confirmed and paid successfully.",
            Instant.now()
        );
        kafkaTemplate.send(KafkaTopics.ORDER_STATUS_UPDATES, event.orderId(), update);
    }

    @KafkaListener(topics = KafkaTopics.PAYMENT_FAILED, groupId = "order-service-group")
    public void onPaymentFailed(PaymentFailedEvent event) {
        log.warn("Saga: Payment failed for order {}. Cancelling order.", event.orderId());
        orderService.updateOrderStatus(event.orderId(), OrderStatus.CANCELLED, "Payment failed: " + event.reason());

        OrderStatusUpdateEvent update = new OrderStatusUpdateEvent(
            event.orderId(),
            OrderStatus.CANCELLED.name(),
            "Payment failed: " + event.reason() + ". Order cancelled.",
            Instant.now()
        );
        kafkaTemplate.send(KafkaTopics.ORDER_STATUS_UPDATES, event.orderId(), update);
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_FAILED, groupId = "order-service-group")
    public void onInventoryFailed(InventoryFailedEvent event) {
        log.warn("Saga: Inventory reservation failed for order {}. Rejecting order.", event.orderId());
        orderService.updateOrderStatus(event.orderId(), OrderStatus.REJECTED, "Inventory out of stock: " + event.reason());

        OrderStatusUpdateEvent update = new OrderStatusUpdateEvent(
            event.orderId(),
            OrderStatus.REJECTED.name(),
            "Insufficient inventory: " + event.reason(),
            Instant.now()
        );
        kafkaTemplate.send(KafkaTopics.ORDER_STATUS_UPDATES, event.orderId(), update);
    }
}
