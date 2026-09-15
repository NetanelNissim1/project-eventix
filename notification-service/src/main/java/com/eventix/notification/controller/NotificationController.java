package com.eventix.notification.controller;

import com.eventix.common.events.OrderStatusUpdateEvent;
import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/test-broadcast")
    public ResponseEntity<String> testBroadcast(
        @RequestParam String orderId,
        @RequestParam String status,
        @RequestParam String message
    ) {
        OrderStatusUpdateEvent event = new OrderStatusUpdateEvent(orderId, status, message, Instant.now());
        messagingTemplate.convertAndSend("/topic/orders", event);
        messagingTemplate.convertAndSend("/topic/orders/" + orderId, event);
        return ResponseEntity.ok("Broadcasted successfully");
    }
}
