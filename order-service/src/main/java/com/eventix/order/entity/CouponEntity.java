package com.eventix.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
public class CouponEntity {

    @Id
    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "description")
    private String description;

    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "usage_count", nullable = false)
    private int usageCount = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public CouponEntity() {}

    public CouponEntity(String code, String description, BigDecimal discountPercent, boolean active) {
        this.code = code;
        this.description = description;
        this.discountPercent = discountPercent;
        this.active = active;
        this.usageCount = 0;
        this.createdAt = Instant.now();
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getUsageCount() {
        return usageCount;
    }

    public void incrementUsage() {
        this.usageCount++;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
