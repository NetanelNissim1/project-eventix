package com.eventix.notification;

import com.eventix.common.events.OrderStatusUpdateEvent;
import com.eventix.notification.kafka.NotificationKafkaListener;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationKafkaListener Unit Tests - WebSocket Push Broadcasting")
class NotificationKafkaListenerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private NotificationKafkaListener listener;

    @BeforeEach
    void setUp() {
        listener = new NotificationKafkaListener(messagingTemplate);
    }

    @Test
    @DisplayName("Should broadcast order status event to global and order-specific WebSocket topics")
    void testOnOrderStatusUpdateBroadcastsToTopics() {
        // Arrange
        String orderId = "order-ws-100";
        OrderStatusUpdateEvent event = new OrderStatusUpdateEvent(
            orderId,
            "PAYMENT_SUCCESS",
            "Payment processed successfully",
            Instant.now()
        );

        // Act
        listener.onOrderStatusUpdate(event);

        // Assert
        verify(messagingTemplate).convertAndSend(eq("/topic/orders"), eq(event));
        verify(messagingTemplate).convertAndSend(eq("/topic/orders/" + orderId), eq(event));
    }
}
