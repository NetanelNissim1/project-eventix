package com.eventix.payment.service;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.AuditEvent;
import com.eventix.common.events.AuditLevel;
import com.eventix.common.events.OrderStatusUpdateEvent;
import com.eventix.common.events.PaymentCompletedEvent;
import com.eventix.common.events.PaymentFailedEvent;
import com.eventix.payment.entity.PaymentTransaction;
import com.eventix.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PaymentService(PaymentRepository paymentRepository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.paymentRepository = paymentRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public void processPayment(String orderId, BigDecimal amount, String traceId) {
        // 1. Idempotency Check: Prevent duplicate payment processing
        Optional<PaymentTransaction> existing = paymentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            log.warn("Idempotency guard: Payment for order {} was already processed (status: {})", 
                orderId, existing.get().getStatus());
            return;
        }

        String paymentId = UUID.randomUUID().toString();
        log.info("Processing payment {} for order {} with amount {}", paymentId, orderId, amount);

        // 2. Simulated Payment Gateway (PSP) Logic
        boolean paymentApproved = amount.compareTo(new BigDecimal("50000.00")) <= 0;

        if (paymentApproved) {
            PaymentTransaction tx = new PaymentTransaction(
                paymentId,
                orderId,
                amount,
                "SUCCESS",
                null,
                Instant.now()
            );
            paymentRepository.save(tx);
            log.info("Payment {} approved for order {}", paymentId, orderId);

            PaymentCompletedEvent completedEvent = new PaymentCompletedEvent(
                orderId,
                paymentId,
                amount,
                Instant.now(),
                traceId
            );
            kafkaTemplate.send(KafkaTopics.PAYMENT_COMPLETED, orderId, completedEvent);

            OrderStatusUpdateEvent statusEvent = new OrderStatusUpdateEvent(
                orderId,
                "PAYMENT_SUCCESS",
                "Payment of $" + amount + " charged successfully.",
                Instant.now()
            );
            kafkaTemplate.send(KafkaTopics.ORDER_STATUS_UPDATES, orderId, statusEvent);

            publishAudit(traceId, AuditLevel.INFO, "PAYMENT_SUCCESS", 
                "Payment " + paymentId + " completed for order " + orderId + " ($" + amount + ")", null);

        } else {
            String failureReason = "Payment rejected: Transaction amount exceeds maximum allowed credit limit";
            PaymentTransaction tx = new PaymentTransaction(
                paymentId,
                orderId,
                amount,
                "FAILED",
                failureReason,
                Instant.now()
            );
            paymentRepository.save(tx);
            log.warn("Payment failed for order {}: {}", orderId, failureReason);

            PaymentFailedEvent failedEvent = new PaymentFailedEvent(
                orderId,
                amount,
                failureReason,
                Instant.now(),
                traceId
            );
            kafkaTemplate.send(KafkaTopics.PAYMENT_FAILED, orderId, failedEvent);

            publishAudit(traceId, AuditLevel.ERROR, "PAYMENT_FAILED", 
                "Payment failed for order " + orderId + ": " + failureReason, failureReason);
        }
    }

    @Transactional(readOnly = true)
    public Optional<PaymentTransaction> getPaymentForOrder(String orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    private void publishAudit(String traceId, AuditLevel level, String action, String details, String error) {
        try {
            AuditEvent audit = new AuditEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                "payment-service",
                traceId,
                "psp-mock",
                "internal",
                level,
                action,
                details,
                error
            );
            kafkaTemplate.send(KafkaTopics.SYSTEM_AUDIT_EVENTS, audit.id(), audit);
        } catch (Exception e) {
            log.warn("Failed to send audit event: {}", e.getMessage());
        }
    }
}
