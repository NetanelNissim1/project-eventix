package com.eventix.order;

import com.eventix.common.dto.OrderItemDto;
import com.eventix.order.dto.CouponResponse;
import com.eventix.order.dto.CreateCouponRequest;
import com.eventix.order.dto.CreateOrderRequest;
import com.eventix.order.dto.OrderResponse;
import com.eventix.order.entity.CouponEntity;
import com.eventix.order.entity.OrderEntity;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.entity.OutboxEvent;
import com.eventix.order.repository.CouponRepository;
import com.eventix.order.repository.OrderRepository;
import com.eventix.order.repository.OutboxEventRepository;
import com.eventix.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
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
    private CouponRepository couponRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        orderService = new OrderService(orderRepository, outboxEventRepository, couponRepository, objectMapper, kafkaTemplate);
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

    @Test
    void testCreateOrderWithCouponAppliesDiscount() {
        OrderItemDto item = new OrderItemDto("prod-1", "Headphones", 1, new BigDecimal("100.00"));
        CreateOrderRequest request = new CreateOrderRequest("cust-1", "user@test.com", List.of(item), "WELCOME10");

        CouponEntity coupon = new CouponEntity("WELCOME10", "10% off", new BigDecimal("10.00"), true);
        when(couponRepository.findByCodeIgnoreCaseAndActiveTrue("WELCOME10")).thenReturn(Optional.of(coupon));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(request, "cust-1", "127.0.0.1", "trace-123");

        assertThat(response).isNotNull();
        // 100 - 10% = 90.00
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("90.00"));
        assertThat(coupon.getUsageCount()).isEqualTo(1);
        verify(couponRepository).save(coupon);
    }

    @Test
    void testValidateCouponReturnsDetails() {
        CouponEntity coupon = new CouponEntity("EVENTIX20", "20% off", new BigDecimal("20.00"), true);
        when(couponRepository.findByCodeIgnoreCaseAndActiveTrue("EVENTIX20")).thenReturn(Optional.of(coupon));

        Optional<CouponResponse> resp = orderService.validateCoupon("eventix20");

        assertThat(resp).isPresent();
        assertThat(resp.get().code()).isEqualTo("EVENTIX20");
        assertThat(resp.get().discountPercent()).isEqualByComparingTo(new BigDecimal("20.00"));
    }

    @Test
    void testCreateCouponPersistsAndReturnsDto() {
        CreateCouponRequest req = new CreateCouponRequest("SUMMER30", "Summer discount", new BigDecimal("30.00"));
        when(couponRepository.save(any(CouponEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CouponResponse resp = orderService.createCoupon(req);

        assertThat(resp).isNotNull();
        assertThat(resp.code()).isEqualTo("SUMMER30");
        assertThat(resp.discountPercent()).isEqualByComparingTo(new BigDecimal("30.00"));
    }

    @Test
    void testGetAllOrders() {
        OrderEntity order1 = new OrderEntity(
                java.util.UUID.randomUUID().toString(),
                "cust-1",
                "admin@eventix.io",
                new BigDecimal("150.00"),
                OrderStatus.CONFIRMED,
                java.time.Instant.now()
        );
        when(orderRepository.findAll()).thenReturn(List.of(order1));

        List<OrderResponse> orders = orderService.getAllOrders();

        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).customerId()).isEqualTo("cust-1");
        assertThat(orders.get(0).status()).isEqualTo(OrderStatus.CONFIRMED);
    }
}
