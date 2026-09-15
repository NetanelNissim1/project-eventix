package com.eventix.audit.service;

import com.eventix.common.events.AuditEvent;
import com.eventix.audit.entity.AuditLogEntity;
import com.eventix.audit.repository.AuditLogRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLogEntity recordAudit(AuditEvent event) {
        String id = (event.id() != null) ? event.id() : UUID.randomUUID().toString();
        Instant timestamp = (event.timestamp() != null) ? event.timestamp() : Instant.now();

        // Security: Apply data masking to prevent sensitive leakages
        String maskedDetails = DataMaskingUtil.mask(event.details());
        String maskedErrors = DataMaskingUtil.mask(event.errorDetails());

        AuditLogEntity entity = new AuditLogEntity(
            id,
            timestamp,
            event.serviceName(),
            event.traceId(),
            event.userId(),
            event.clientIp(),
            event.level().name(),
            event.action(),
            maskedDetails,
            maskedErrors
        );

        AuditLogEntity saved = auditLogRepository.save(entity);
        log.info("Audit [{}][{}] Recorded action '{}' by user '{}'", 
            saved.getServiceName(), saved.getLevel(), saved.getAction(), saved.getUserId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntity> getLogs(String level, String serviceName, Pageable pageable) {
        if (level != null && !level.isBlank()) {
            return auditLogRepository.findByLevelOrderByTimestampDesc(level.toUpperCase(), pageable);
        }
        if (serviceName != null && !serviceName.isBlank()) {
            return auditLogRepository.findByServiceNameOrderByTimestampDesc(serviceName, pageable);
        }
        return auditLogRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getAuditStats() {
        Map<String, Long> stats = new HashMap<>();
        List<Object[]> counts = auditLogRepository.countGroupedByLevel();
        for (Object[] row : counts) {
            stats.put((String) row[0], (Long) row[1]);
        }
        stats.putIfAbsent("INFO", 0L);
        stats.putIfAbsent("WARNING", 0L);
        stats.putIfAbsent("ERROR", 0L);
        stats.putIfAbsent("SECURITY_ALERT", 0L);
        return stats;
    }

    @Transactional(readOnly = true)
    public List<AuditLogEntity> getLogsBetween(Instant start, Instant end) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end);
    }
}
