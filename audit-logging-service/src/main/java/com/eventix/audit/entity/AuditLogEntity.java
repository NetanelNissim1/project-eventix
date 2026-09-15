package com.eventix.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_service", columnList = "service_name"),
        @Index(name = "idx_audit_level", columnList = "level"),
        @Index(name = "idx_audit_trace", columnList = "trace_id")
    }
)
public class AuditLogEntity {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "service_name", nullable = false, length = 50)
    private String serviceName;

    @Column(name = "trace_id", length = 50)
    private String traceId;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "client_ip", length = 50)
    private String clientIp;

    @Column(name = "level", nullable = false, length = 20)
    private String level; // INFO, WARNING, ERROR, SECURITY_ALERT

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    public AuditLogEntity() {}

    public AuditLogEntity(String id, Instant timestamp, String serviceName, String traceId, String userId, 
                          String clientIp, String level, String action, String details, String errorDetails) {
        this.id = id;
        this.timestamp = timestamp;
        this.serviceName = serviceName;
        this.traceId = traceId;
        this.userId = userId;
        this.clientIp = clientIp;
        this.level = level;
        this.action = action;
        this.details = details;
        this.errorDetails = errorDetails;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }
}
