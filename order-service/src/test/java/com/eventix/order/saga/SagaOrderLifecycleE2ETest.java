package com.eventix.order.saga;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.dto.OrderItemDto;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.OrderStatusUpdateEvent;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.order.dto.CreateOrderRequest;
import com.eventix.order.dto.OrderResponse;
import com.eventix.order.entity.OrderEntity;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.entity.OutboxEvent;
import com.eventix.order.kafka.OrderSagaListener;
import com.eventix.order.repository.CouponRepository;
import com.eventix.order.repository.OrderRepository;
import com.eventix.order.repository.OutboxEventRepository;
import com.eventix.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("E2E Critical Path: Distributed Saga Order Lifecycle & Compensation Flow")
class SagaOrderLifecycleE2ETest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private OrderService orderService;
    private OrderSagaListener sagaListener;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        orderService = new OrderService(orderRepository, outboxEventRepository, couponRepository, objectMapper, kafkaTemplate);
        sagaListener = new OrderSagaListener(orderService, kafkaTemplate);
    }

    @Test
    @DisplayName("Critical Path Happy Flow: Order Placed -> Outbox Created -> Payment Succeeded -> Order CONFIRMED")
    void testCompleteHappyPathSagaFlow() {
        // Step 1: Client submits CreateOrderRequest
        OrderItemDto item = new OrderItemDto("prod-100", "Apple MacBook Pro", 1, new BigDecimal("2499.00"));
        CreateOrderRequest request = new CreateOrderRequest("customer-1", "buyer@eventix.io", List.of(item));

        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse initialOrder = orderService.createOrder(request, "customer-1", "192.168.1.1", "trace-e2e-happy");

        // Verify initial state is PENDING and Outbox is populated
        assertThat(initialOrder.status()).isEqualTo(OrderStatus.PENDING);
        verify(outboxEventRepository).save(any(OutboxEvent.class));

        // Step 2: Payment service emits PaymentCompletedEvent downstream
        PaymentCompletedEvent paymentEvent = new PaymentCompletedEvent(
            initialOrder.id(),
            "pay-uuid-777",
            new BigDecimal("2499.00"),
            Instant.now(),
            "trace-e2e-happy"
        );

        OrderEntity pendingEntity = new OrderEntity(
            initialOrder.id(),
            "customer-1",
            "buyer@eventix.io",
            new BigDecimal("2499.00"),
            OrderStatus.PENDING,
            Instant.now()
        );
        when(orderRepository.findById(initialOrder.id())).thenReturn(Optional.of(pendingEntity));

        // Act: Saga Listener processes payment completion
        sagaListener.onPaymentCompleted(paymentEvent);

        // Assert: Order status transitioned to CONFIRMED
        assertThat(pendingEntity.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository, atLeastOnce()).save(pendingEntity);

        // Verify WebSocket update was pushed
        ArgumentCaptor<OrderStatusUpdateEvent> wsCaptor = ArgumentCaptor.forClass(OrderStatusUpdateEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.ORDER_STATUS_UPDATES), eq(initialOrder.id()), wsCaptor.capture());
        assertThat(wsCaptor.getValue().status()).isEqualTo("CONFIRMED");
    }

    @Test
    @DisplayName("Saga Compensation: Order Placed -> Payment Declines -> Order CANCELLED & Alert Emitted")
    void testPaymentFailureTriggersSagaCompensation() {
        String orderId = "order-compensate-flow";
        OrderEntity pendingOrder = new OrderEntity(
            orderId, "customer-9", "fail@eventix.io", new BigDecimal("55000.00"), OrderStatus.PENDING, Instant.now()
        );
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(pendingOrder));

        PaymentFailedEvent failedEvent = new PaymentFailedEvent(
            orderId,
            new BigDecimal("55000.00"),
            "Credit limit exceeded",
            Instant.now(),
            "trace-compensate"
        );

        // Act: Saga Listener handles failure event
        sagaListener.onPaymentFailed(failedEvent);

        // Assert: Order state transitions to CANCELLED
        assertThat(pendingOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orderRepository).save(pendingOrder);

        // Verify broadcast of CANCELLED update
        ArgumentCaptor<OrderStatusUpdateEvent> wsCaptor = ArgumentCaptor.forClass(OrderStatusUpdateEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.ORDER_STATUS_UPDATES), eq(orderId), wsCaptor.capture());
        assertThat(wsCaptor.getValue().status()).isEqualTo("CANCELLED");
        assertThat(wsCaptor.getValue().message()).contains("Credit limit exceeded");
    }

    @Test
    @DisplayName("Saga Compensation: Out of Stock -> Order REJECTED & Alert Emitted")
    void testInventoryFailureTriggersOrderRejection() {
        String orderId = "order-inventory-fail";
        OrderEntity pendingOrder = new OrderEntity(
            orderId, "customer-3", "out-of-stock@eventix.io", new BigDecimal("120.00"), OrderStatus.PENDING, Instant.now()
        );
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(pendingOrder));

        InventoryFailedEvent inventoryFailed = new InventoryFailedEvent(
            orderId,
            "Insufficient stock for product prod-1",
            Instant.now(),
            "trace-inv-fail"
        );

        // Act
        sagaListener.onInventoryFailed(inventoryFailed);

        // Assert
        assertThat(pendingOrder.getStatus()).isEqualTo(OrderStatus.REJECTED);
        verify(orderRepository).save(pendingOrder);

        ArgumentCaptor<OrderStatusUpdateEvent> wsCaptor = ArgumentCaptor.forClass(OrderStatusUpdateEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.ORDER_STATUS_UPDATES), eq(orderId), wsCaptor.capture());
        assertThat(wsCaptor.getValue().status()).isEqualTo("REJECTED");
    }
}
