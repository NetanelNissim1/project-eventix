package com.eventix.payment.repository;

import com.eventix.payment.entity.PaymentTransaction;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentTransaction, String> {
    Optional<PaymentTransaction> findByOrderId(String orderId);
    boolean existsByOrderId(String orderId);
}
