package com.eventix.order.service;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.dto.OrderItemDto;
import com.eventix.common.events.AuditEvent;
import com.eventix.common.events.AuditLevel;
import com.eventix.common.events.OrderCreatedEvent;
import com.eventix.order.dto.CreateOrderRequest;
import com.eventix.order.dto.OrderResponse;
import com.eventix.order.entity.OrderEntity;
import com.eventix.order.entity.OrderItemEntity;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.entity.OutboxEvent;
import com.eventix.order.repository.OrderRepository;
import com.eventix.order.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderService(
        OrderRepository orderRepository,
        OutboxEventRepository outboxEventRepository,
        ObjectMapper objectMapper,
        KafkaTemplate<String, Object> kafkaTemplate
    ) {
        this.orderRepository = orderRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String userId, String clientIp, String traceId) {
        String effectiveTraceId = (traceId != null && !traceId.isBlank()) ? traceId : UUID.randomUUID().toString();
        String orderId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        BigDecimal totalAmount = request.items().stream()
            .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        OrderEntity order = new OrderEntity(
            orderId,
            request.customerId(),
            request.customerEmail(),
            totalAmount,
            OrderStatus.PENDING,
            now
        );

        for (OrderItemDto itemDto : request.items()) {
            OrderItemEntity itemEntity = new OrderItemEntity(
                itemDto.productId(),
                itemDto.productName(),
                itemDto.quantity(),
                itemDto.unitPrice()
            );
            order.addItem(itemEntity);
        }

        OrderEntity savedOrder = orderRepository.save(order);

        // 1. Prepare domain event
        OrderCreatedEvent event = new OrderCreatedEvent(
            orderId,
            request.customerId(),
            request.customerEmail(),
            request.items(),
            totalAmount,
            OrderStatus.PENDING.name(),
            now,
            effectiveTraceId
        );

        // 2. Transactional Outbox Pattern for Debezium CDC
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            OutboxEvent outboxRecord = new OutboxEvent(
                UUID.randomUUID().toString(),
                "Order",
                orderId,
                "OrderCreated",
                eventJson,
                now,
                "PENDING"
            );
            outboxEventRepository.save(outboxRecord);
            log.info("Saved order {} and outbox event {} atomically", orderId, outboxRecord.getId());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize OrderCreatedEvent to JSON", e);
        }

        // 3. Publish audit event asynchronously
        publishAuditEvent(
            effectiveTraceId,
            userId != null ? userId : request.customerId(),
            clientIp,
            AuditLevel.INFO,
            "CREATE_ORDER",
            "Order created with total " + totalAmount + " for customer " + request.customerId(),
            null
        );

        return mapToResponse(savedOrder);
    }

    @Transactional
    public void updateOrderStatus(String orderId, OrderStatus newStatus, String reason) {
        OrderEntity order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);
        orderRepository.save(order);

        log.info("Order {} transitioned from {} to {}", orderId, previousStatus, newStatus);

        publishAuditEvent(
            UUID.randomUUID().toString(),
            order.getCustomerId(),
            "internal",
            AuditLevel.INFO,
            "UPDATE_ORDER_STATUS",
            "Order status changed to " + newStatus + ". Reason: " + (reason != null ? reason : "N/A"),
            null
        );
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(String orderId) {
        return orderRepository.findById(orderId)
            .map(this::mapToResponse)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomer(String customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(this::mapToResponse)
            .toList();
    }

    private void publishAuditEvent(String traceId, String userId, String ip, AuditLevel level, String action, String details, String error) {
        try {
            AuditEvent auditEvent = new AuditEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                "order-service",
                traceId,
                userId,
                ip,
                level,
                action,
                details,
                error
            );
            kafkaTemplate.send(KafkaTopics.SYSTEM_AUDIT_EVENTS, auditEvent.id(), auditEvent);
        } catch (Exception e) {
            log.warn("Failed to publish audit event: {}", e.getMessage());
        }
    }

    private OrderResponse mapToResponse(OrderEntity order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
            .map(item -> new OrderItemDto(item.getProductId(), item.getProductName(), item.getQuantity(), item.getUnitPrice()))
            .toList();

        return new OrderResponse(
            order.getId(),
            order.getCustomerId(),
            order.getCustomerEmail(),
            order.getTotalAmount(),
            order.getStatus(),
            order.getCreatedAt(),
            order.getUpdatedAt(),
            itemDtos
        );
    }
}
