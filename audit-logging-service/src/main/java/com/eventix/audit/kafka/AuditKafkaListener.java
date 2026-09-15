package com.eventix.audit.kafka;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.events.AuditEvent;
import com.eventix.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AuditKafkaListener {

    private static final Logger log = LoggerFactory.getLogger(AuditKafkaListener.class);

    private final AuditService auditService;

    public AuditKafkaListener(AuditService auditService) {
        this.auditService = auditService;
    }

    @KafkaListener(topics = KafkaTopics.SYSTEM_AUDIT_EVENTS, groupId = "audit-logging-group")
    public void onAuditEvent(AuditEvent event) {
        log.debug("Consuming audit event from Kafka: {} [Service: {}]", event.action(), event.serviceName());
        auditService.recordAudit(event);
    }
}
