package com.eventix.audit.controller;

import com.eventix.common.events.AuditEvent;
import com.eventix.audit.entity.AuditLogEntity;
import com.eventix.audit.service.AuditService;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLogEntity>> getLogs(
        @RequestParam(required = false) String level,
        @RequestParam(required = false) String serviceName,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(auditService.getLogs(level, serviceName, PageRequest.of(page, size)));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(auditService.getAuditStats());
    }

    @PostMapping
    public ResponseEntity<AuditLogEntity> recordLog(@RequestBody AuditEvent event) {
        return ResponseEntity.ok(auditService.recordAudit(event));
    }
}
