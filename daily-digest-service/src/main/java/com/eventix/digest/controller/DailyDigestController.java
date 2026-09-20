package com.eventix.digest.controller;

import com.eventix.digest.dto.CustomerActivitySummary;
import com.eventix.digest.dto.CustomerPurchaseSummary;
import com.eventix.digest.dto.DigestScheduleConfig;
import com.eventix.digest.dto.RecordActivityRequest;
import com.eventix.digest.dto.SmtpConfigDto;
import com.eventix.digest.entity.DailyDigestRecord;
import com.eventix.digest.service.DailyDigestService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/digest")
@CrossOrigin(origins = "*")
public class DailyDigestController {

    private final DailyDigestService digestService;

    public DailyDigestController(DailyDigestService digestService) {
        this.digestService = digestService;
    }

    @PostMapping("/trigger-now")
    public ResponseEntity<DailyDigestRecord> triggerDigest(
        @RequestParam(required = false, defaultValue = "bill.nissim@gmail.com") String recipient
    ) {
        return ResponseEntity.ok(digestService.generateAndSendDigest(recipient));
    }

    @GetMapping("/smtp")
    public ResponseEntity<SmtpConfigDto> getSmtpConfig() {
        return ResponseEntity.ok(digestService.getSmtpConfig());
    }

    @PostMapping("/smtp")
    public ResponseEntity<SmtpConfigDto> updateSmtpConfig(
        @RequestBody SmtpConfigDto dto
    ) {
        return ResponseEntity.ok(digestService.updateSmtpConfig(dto));
    }

    @PostMapping("/smtp/test")
    public ResponseEntity<Map<String, Object>> testSmtp(
        @RequestParam(required = false, defaultValue = "bill.nissim@gmail.com") String recipient,
        @RequestBody(required = false) SmtpConfigDto optionalDto
    ) {
        if (optionalDto != null) {
            digestService.updateSmtpConfig(optionalDto);
        }
        return ResponseEntity.ok(digestService.testSmtpConnection(recipient));
    }

    @GetMapping("/schedule")
    public ResponseEntity<DigestScheduleConfig> getSchedule() {
        return ResponseEntity.ok(digestService.getScheduleConfig());
    }

    @PostMapping("/schedule")
    public ResponseEntity<DigestScheduleConfig> updateSchedule(
        @RequestBody DigestScheduleConfig config
    ) {
        return ResponseEntity.ok(digestService.updateScheduleConfig(config));
    }

    @PostMapping("/record-activity")
    public ResponseEntity<Map<String, String>> recordActivity(
        @RequestBody RecordActivityRequest request
    ) {
        if ("SEARCH".equalsIgnoreCase(request.action()) || "CUSTOMER_SEARCH".equalsIgnoreCase(request.action())) {
            digestService.recordCustomerSearch(request.details());
        } else {
            digestService.recordCustomerActivity(request.customerEmail(), request.action(), request.details());
        }
        return ResponseEntity.ok(Map.of("status", "recorded"));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyDigestRecord>> getHistory() {
        return ResponseEntity.ok(digestService.getDigestHistory());
    }

    @GetMapping("/today-summary")
    public ResponseEntity<Map<String, Object>> getTodaySummary() {
        List<CustomerPurchaseSummary> purchases = digestService.getDailyPurchases();
        Map<String, Integer> searches = digestService.getCustomerSearches();
        List<CustomerActivitySummary> activities = digestService.getDailyActivities();
        return ResponseEntity.ok(Map.of(
            "purchases", purchases,
            "searches", searches,
            "activities", activities
        ));
    }
}
