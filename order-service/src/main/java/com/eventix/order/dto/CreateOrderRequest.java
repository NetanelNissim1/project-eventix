package com.eventix.order.dto;

import com.eventix.common.dto.OrderItemDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderRequest(
    @NotBlank(message = "Customer ID is required")
    String customerId,

    @NotBlank(message = "Customer email is required")
    @Email(message = "Valid email is required")
    String customerEmail,

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    List<OrderItemDto> items
) {}
