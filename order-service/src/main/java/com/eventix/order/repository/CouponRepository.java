package com.eventix.order.repository;

import com.eventix.order.entity.CouponEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRepository extends JpaRepository<CouponEntity, String> {
    Optional<CouponEntity> findByCodeIgnoreCaseAndActiveTrue(String code);
}
