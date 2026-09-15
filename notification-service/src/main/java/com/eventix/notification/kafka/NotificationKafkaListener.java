package com.eventix.notification.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.OrderStatusUpdateEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationKafkaListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationKafkaListener.class);

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationKafkaListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = KafkaTopics.ORDER_STATUS_UPDATES, groupId = "notification-service-group")
    public void onOrderStatusUpdate(OrderStatusUpdateEvent event) {
        log.info("Pushing WebSocket live update for order {}: {} ({})", 
            event.orderId(), event.status(), event.message());

        // Broadcast to general order topic and order-specific topic
        messagingTemplate.convertAndSend("/topic/orders", event);
        messagingTemplate.convertAndSend("/topic/orders/" + event.orderId(), event);
    }
}
