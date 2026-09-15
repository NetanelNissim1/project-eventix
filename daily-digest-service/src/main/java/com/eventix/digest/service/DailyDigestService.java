package com.eventix.digest.service;

import com.eventix.digest.entity.DailyDigestRecord;
import com.eventix.digest.repository.DailyDigestRepository;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyDigestService {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestService.class);

    private final DailyDigestRepository digestRepository;
    private final JavaMailSender mailSender;

    @Value("${digest.email.recipient:admin@eventix.com}")
    private String defaultRecipient;

    @Value("${digest.email.sender:noreply@eventix.com}")
    private String defaultSender;

    // Daily in-memory accumulators for streaming events
    private final AtomicInteger ordersCount = new AtomicInteger(0);
    private final AtomicInteger confirmedCount = new AtomicInteger(0);
    private final AtomicInteger failedCount = new AtomicInteger(0);
    private final AtomicReference<BigDecimal> totalRevenue = new AtomicReference<>(BigDecimal.ZERO);
    private final AtomicInteger errorsCount = new AtomicInteger(0);
    private final AtomicInteger warningsCount = new AtomicInteger(0);

    public DailyDigestService(DailyDigestRepository digestRepository, JavaMailSender mailSender) {
        this.digestRepository = digestRepository;
        this.mailSender = mailSender;
    }

    public void recordOrderCreated(BigDecimal amount) {
        ordersCount.incrementAndGet();
    }

    public void recordOrderConfirmed(BigDecimal amount) {
        confirmedCount.incrementAndGet();
        if (amount != null) {
            totalRevenue.accumulateAndGet(amount, BigDecimal::add);
        }
    }

    public void recordOrderFailed() {
        failedCount.incrementAndGet();
    }

    public void recordSystemIssue(boolean isError) {
        if (isError) {
            errorsCount.incrementAndGet();
        } else {
            warningsCount.incrementAndGet();
        }
    }

    // Runs automatically every day at 23:00 (11 PM)
    @Scheduled(cron = "${digest.cron:0 0 23 * * ?}")
    public void runScheduledDigest() {
        log.info("Executing scheduled Daily Digest job...");
        generateAndSendDigest(defaultRecipient);
    }

    @Transactional
    public DailyDigestRecord generateAndSendDigest(String recipient) {
        String effectiveRecipient = (recipient != null && !recipient.isBlank()) ? recipient : defaultRecipient;
        LocalDate today = LocalDate.now();

        int orders = ordersCount.get();
        int confirmed = confirmedCount.get();
        int failed = failedCount.get();
        BigDecimal revenue = totalRevenue.get();
        int errors = errorsCount.get();
        int warnings = warningsCount.get();

        String htmlContent = buildHtmlReport(today, orders, confirmed, failed, revenue, errors, warnings);
        String status = "SENT";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(defaultSender);
            helper.setTo(effectiveRecipient);
            helper.setSubject("📊 Eventix Daily Digest Report - " + today);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully sent Daily Digest email to {}", effectiveRecipient);
        } catch (Exception e) {
            log.error("Failed to send Daily Digest email: {}", e.getMessage(), e);
            status = "FAILED";
        }

        DailyDigestRecord record = new DailyDigestRecord(
            UUID.randomUUID().toString(),
            today,
            orders,
            confirmed,
            failed,
            revenue,
            errors,
            warnings,
            effectiveRecipient,
            status,
            Instant.now()
        );

        return digestRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<DailyDigestRecord> getDigestHistory() {
        return digestRepository.findAllByOrderByReportDateDesc();
    }

    private String buildHtmlReport(LocalDate date, int orders, int confirmed, int failed, BigDecimal revenue, int errors, int warnings) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; }
                    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
                    .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; }
                    .header h1 { color: #38bdf8; margin: 0; font-size: 24px; }
                    .date { color: #94a3b8; font-size: 14px; margin-top: 6px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
                    .card { background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; }
                    .card-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold; }
                    .card-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
                    .val-revenue { color: #4ade80; }
                    .val-orders { color: #38bdf8; }
                    .val-errors { color: #f87171; }
                    .val-warnings { color: #fbbf24; }
                    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚡ Project Eventix - Daily Digest</h1>
                        <div class="date">Daily Summary for %s</div>
                    </div>
                    <div class="grid">
                        <div class="card">
                            <div class="card-label">Total Revenue</div>
                            <div class="card-value val-revenue">$%s</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Total Orders Placed</div>
                            <div class="card-value val-orders">%d</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Successful Transactions</div>
                            <div class="card-value val-revenue">%d</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Failed / Cancelled</div>
                            <div class="card-value val-errors">%d</div>
                        </div>
                        <div class="card">
                            <div class="card-label">System Errors</div>
                            <div class="card-value val-errors">%d</div>
                        </div>
                        <div class="card">
                            <div class="card-label">System Warnings</div>
                            <div class="card-value val-warnings">%d</div>
                        </div>
                    </div>
                    <div class="footer">
                        Automated Daily Security & Operations Digest &bull; Project Eventix Enterprise Platform
                    </div>
                </div>
            </body>
            </html>
            """.formatted(date, revenue.toPlainString(), orders, confirmed, failed, errors, warnings);
    }
}
