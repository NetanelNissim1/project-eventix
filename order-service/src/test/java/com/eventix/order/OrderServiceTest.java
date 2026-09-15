package com.eventix.order;

import com.eventix.common.dto.OrderItemDto;
import com.eventix.order.dto.CreateOrderRequest;
import com.eventix.order.dto.OrderResponse;
import com.eventix.order.entity.OrderEntity;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.entity.OutboxEvent;
import com.eventix.order.repository.OrderRepository;
import com.eventix.order.repository.OutboxEventRepository;
import com.eventix.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        orderService = new OrderService(orderRepository, outboxEventRepository, objectMapper, kafkaTemplate);
    }

    @Test
    void testCreateOrderSavesOrderAndOutboxAtomically() {
        OrderItemDto item = new OrderItemDto("prod-1", "Headphones", 2, new BigDecimal("100.00"));
        CreateOrderRequest request = new CreateOrderRequest("cust-1", "user@test.com", List.of(item));

        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(request, "cust-1", "127.0.0.1", "trace-123");

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING);
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("200.00"));

        // Verify outbox record was saved
        ArgumentCaptor<OutboxEvent> outboxCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxEventRepository).save(outboxCaptor.capture());

        OutboxEvent capturedOutbox = outboxCaptor.getValue();
        assertThat(capturedOutbox.getAggregateType()).isEqualTo("Order");
        assertThat(capturedOutbox.getEventType()).isEqualTo("OrderCreated");
        assertThat(capturedOutbox.getStatus()).isEqualTo("PENDING");
        assertThat(capturedOutbox.getPayload()).contains("user@test.com");
    }
}
