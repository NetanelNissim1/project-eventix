package com.eventix.digest.controller;

import com.eventix.digest.entity.DailyDigestRecord;
import com.eventix.digest.service.DailyDigestService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/digest")
public class DailyDigestController {

    private final DailyDigestService digestService;

    public DailyDigestController(DailyDigestService digestService) {
        this.digestService = digestService;
    }

    @PostMapping("/trigger-now")
    public ResponseEntity<DailyDigestRecord> triggerDigest(
        @RequestParam(required = false) String recipient
    ) {
        return ResponseEntity.ok(digestService.generateAndSendDigest(recipient));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyDigestRecord>> getHistory() {
        return ResponseEntity.ok(digestService.getDigestHistory());
    }
}
