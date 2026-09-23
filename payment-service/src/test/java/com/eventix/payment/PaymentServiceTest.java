package com.eventix.payment;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.payment.entity.PaymentTransaction;
import com.eventix.payment.repository.PaymentRepository;
import com.eventix.payment.service.PaymentService;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests - Gateway Processing, Idempotency & Queries")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, kafkaTemplate);
    }

    @Test
    @DisplayName("Idempotency: Should skip processing when order was already charged")
    void testPaymentIdempotencySkipsAlreadyProcessedOrder() {
        // Arrange
        String orderId = "order-test-123";
        PaymentTransaction existingTx = new PaymentTransaction(
            "pay-1", orderId, new BigDecimal("150.00"), "SUCCESS", null, Instant.now()
        );

        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(existingTx));

        // Act
        paymentService.processPayment(orderId, new BigDecimal("150.00"), "trace-abc");

        // Assert
        verify(paymentRepository, never()).save(any(PaymentTransaction.class));
        verify(kafkaTemplate, never()).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Approval: Should approve valid payment amount and emit PaymentCompletedEvent")
    void testProcessPaymentApproved() {
        // Arrange
        String orderId = "order-happy-path";
        BigDecimal amount = new BigDecimal("250.00");
        String traceId = "trace-happy";

        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        paymentService.processPayment(orderId, amount, traceId);

        // Assert
        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentRepository).save(txCaptor.capture());
        PaymentTransaction savedTx = txCaptor.getValue();

        assertThat(savedTx.getOrderId()).isEqualTo(orderId);
        assertThat(savedTx.getAmount()).isEqualByComparingTo(amount);
        assertThat(savedTx.getStatus()).isEqualTo("SUCCESS");
        assertThat(savedTx.getReason()).isNull();

        ArgumentCaptor<PaymentCompletedEvent> eventCaptor = ArgumentCaptor.forClass(PaymentCompletedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.PAYMENT_COMPLETED), eq(orderId), eventCaptor.capture());
        assertThat(eventCaptor.getValue().orderId()).isEqualTo(orderId);
        assertThat(eventCaptor.getValue().amount()).isEqualByComparingTo(amount);
    }

    @Test
    @DisplayName("Decline: Should reject payment when amount exceeds credit threshold and emit PaymentFailedEvent")
    void testProcessPaymentDeclinedWhenExceedsLimit() {
        // Arrange
        String orderId = "order-high-value";
        BigDecimal excessiveAmount = new BigDecimal("75000.00"); // Above 50,000 threshold
        String traceId = "trace-decline";

        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        paymentService.processPayment(orderId, excessiveAmount, traceId);

        // Assert
        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentRepository).save(txCaptor.capture());
        PaymentTransaction savedTx = txCaptor.getValue();

        assertThat(savedTx.getStatus()).isEqualTo("FAILED");
        assertThat(savedTx.getReason()).contains("exceeds maximum allowed credit limit");

        ArgumentCaptor<PaymentFailedEvent> eventCaptor = ArgumentCaptor.forClass(PaymentFailedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.PAYMENT_FAILED), eq(orderId), eventCaptor.capture());
        assertThat(eventCaptor.getValue().orderId()).isEqualTo(orderId);
        assertThat(eventCaptor.getValue().reason()).contains("credit limit");
    }

    @Test
    @DisplayName("Query: Should retrieve payment transaction by order ID")
    void testGetPaymentForOrder() {
        // Arrange
        PaymentTransaction tx1 = new PaymentTransaction("pay-1", "order-1", new BigDecimal("100.00"), "SUCCESS", null, Instant.now());
        when(paymentRepository.findByOrderId("order-1")).thenReturn(Optional.of(tx1));

        // Act
        Optional<PaymentTransaction> single = paymentService.getPaymentForOrder("order-1");

        // Assert
        assertThat(single).isPresent();
        assertThat(single.get().getPaymentId()).isEqualTo("pay-1");
        assertThat(single.get().getStatus()).isEqualTo("SUCCESS");
    }
}
