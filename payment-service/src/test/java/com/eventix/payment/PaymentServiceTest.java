package com.eventix.payment;

import com.eventix.payment.entity.PaymentTransaction;
import com.eventix.payment.repository.PaymentRepository;
import com.eventix.payment.service.PaymentService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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
    void testPaymentIdempotencySkipsAlreadyProcessedOrder() {
        String orderId = "order-test-123";
        PaymentTransaction existingTx = new PaymentTransaction(
            "pay-1", orderId, new BigDecimal("150.00"), "SUCCESS", null, Instant.now()
        );

        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(existingTx));

        // Call again with same order ID
        paymentService.processPayment(orderId, new BigDecimal("150.00"), "trace-abc");

        // Verify save was NOT called again
        verify(paymentRepository, never()).save(any(PaymentTransaction.class));
    }
}
