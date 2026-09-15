package com.eventix.digest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "daily_digests")
public class DailyDigestRecord {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "total_orders", nullable = false)
    private int totalOrders;

    @Column(name = "confirmed_orders", nullable = false)
    private int confirmedOrders;

    @Column(name = "failed_orders", nullable = false)
    private int failedOrders;

    @Column(name = "total_revenue", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "total_errors", nullable = false)
    private int totalErrors;

    @Column(name = "total_warnings", nullable = false)
    private int totalWarnings;

    @Column(name = "email_recipient", nullable = false)
    private String emailRecipient;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    public DailyDigestRecord() {}

    public DailyDigestRecord(String id, LocalDate reportDate, int totalOrders, int confirmedOrders, int failedOrders, 
                             BigDecimal totalRevenue, int totalErrors, int totalWarnings, String emailRecipient, 
                             String status, Instant generatedAt) {
        this.id = id;
        this.reportDate = reportDate;
        this.totalOrders = totalOrders;
        this.confirmedOrders = confirmedOrders;
        this.failedOrders = failedOrders;
        this.totalRevenue = totalRevenue;
        this.totalErrors = totalErrors;
        this.totalWarnings = totalWarnings;
        this.emailRecipient = emailRecipient;
        this.status = status;
        this.generatedAt = generatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public int getConfirmedOrders() { return confirmedOrders; }
    public void setConfirmedOrders(int confirmedOrders) { this.confirmedOrders = confirmedOrders; }

    public int getFailedOrders() { return failedOrders; }
    public void setFailedOrders(int failedOrders) { this.failedOrders = failedOrders; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public int getTotalErrors() { return totalErrors; }
    public void setTotalErrors(int totalErrors) { this.totalErrors = totalErrors; }

    public int getTotalWarnings() { return totalWarnings; }
    public void setTotalWarnings(int totalWarnings) { this.totalWarnings = totalWarnings; }

    public String getEmailRecipient() { return emailRecipient; }
    public void setEmailRecipient(String emailRecipient) { this.emailRecipient = emailRecipient; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
