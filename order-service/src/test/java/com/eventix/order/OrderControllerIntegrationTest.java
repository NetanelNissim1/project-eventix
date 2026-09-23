package com.eventix.order;

import com.eventix.common.dto.OrderItemDto;
import com.eventix.order.controller.OrderController;
import com.eventix.order.dto.CouponResponse;
import com.eventix.order.dto.CreateOrderRequest;
import com.eventix.order.dto.OrderResponse;
import com.eventix.order.entity.OrderStatus;
import com.eventix.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderController Integration Tests - HTTP API Contracts & Status Codes")
class OrderControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        OrderController controller = new OrderController(orderService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("POST /api/v1/orders - Valid request returns 201 Created with Location header")
    void testCreateOrderReturns201Created() throws Exception {
        OrderItemDto item = new OrderItemDto("prod-1", "Headphones", 2, new BigDecimal("100.00"));
        CreateOrderRequest request = new CreateOrderRequest("cust-1", "user@eventix.io", List.of(item));

        OrderResponse expectedResponse = new OrderResponse(
            "order-12345",
            "cust-1",
            "user@eventix.io",
            new BigDecimal("200.00"),
            OrderStatus.PENDING,
            Instant.now(),
            Instant.now(),
            List.of(item)
        );

        when(orderService.createOrder(any(CreateOrderRequest.class), any(), any(), any())).thenReturn(expectedResponse);

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-Correlation-Id", "corr-999"))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/v1/orders/order-12345"))
            .andExpect(jsonPath("$.id").value("order-12345"))
            .andExpect(jsonPath("$.customerId").value("cust-1"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.totalAmount").value(200.00));
    }

    @Test
    @DisplayName("POST /api/v1/orders - Invalid request body returns 400 Bad Request")
    void testCreateOrderInvalidReturns400() throws Exception {
        // Missing customerId and customerEmail (violates @NotBlank)
        String invalidJson = "{\"customerId\": \"\", \"items\": []}";

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/orders/{orderId} - Returns 200 OK with order details")
    void testGetOrderReturns200() throws Exception {
        OrderResponse order = new OrderResponse(
            "order-abc",
            "cust-1",
            "test@eventix.io",
            new BigDecimal("99.99"),
            OrderStatus.CONFIRMED,
            Instant.now(),
            Instant.now(),
            List.of()
        );
        when(orderService.getOrder("order-abc")).thenReturn(order);

        mockMvc.perform(get("/api/v1/orders/order-abc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("order-abc"))
            .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/coupons/validate?code=PROMO10 - Returns 200 OK when found, 404 when absent")
    void testValidateCouponEndpoints() throws Exception {
        CouponResponse coupon = new CouponResponse("PROMO10", "10% off", new BigDecimal("10.00"), true, 5);
        when(orderService.validateCoupon("PROMO10")).thenReturn(Optional.of(coupon));
        when(orderService.validateCoupon("INVALID")).thenReturn(Optional.empty());

        // Valid coupon
        mockMvc.perform(get("/api/v1/orders/coupons/validate").param("code", "PROMO10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("PROMO10"))
            .andExpect(jsonPath("$.discountPercent").value(10.00));

        // Invalid coupon
        mockMvc.perform(get("/api/v1/orders/coupons/validate").param("code", "INVALID"))
            .andExpect(status().isNotFound());
    }
}
