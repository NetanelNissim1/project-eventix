package com.eventix.digest.service;

import com.eventix.digest.dto.CustomerActivitySummary;
import com.eventix.digest.dto.CustomerPurchaseSummary;
import com.eventix.digest.dto.DigestScheduleConfig;
import com.eventix.digest.dto.SmtpConfigDto;
import com.eventix.digest.entity.DailyDigestRecord;
import com.eventix.digest.repository.DailyDigestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyDigestService {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestService.class);

    private final DailyDigestRepository digestRepository;
    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${digest.email.recipient:bill.nissim@gmail.com}")
    private String defaultRecipient;

    @Value("${digest.email.sender:nati.nissim@gmail.com}")
    private String defaultSender;

    @Value("${digest.google.script.url:https://script.google.com/macros/s/AKfycby0ZFfsbHH6TwO39Hw4RqE__cjrnMkdmzrN6rOeOic7OZ8qD7CU1-Pc_lfWArTp3Iia/exec}")
    private String defaultGoogleScriptUrl;

    private final AtomicReference<String> googleScriptUrl = new AtomicReference<>("https://script.google.com/macros/s/AKfycby0ZFfsbHH6TwO39Hw4RqE__cjrnMkdmzrN6rOeOic7OZ8qD7CU1-Pc_lfWArTp3Iia/exec");

    // Daily in-memory accumulators for streaming events
    private final AtomicInteger ordersCount = new AtomicInteger(0);
    private final AtomicInteger confirmedCount = new AtomicInteger(0);
    private final AtomicInteger failedCount = new AtomicInteger(0);
    private final AtomicReference<BigDecimal> totalRevenue = new AtomicReference<>(BigDecimal.ZERO);
    private final AtomicInteger errorsCount = new AtomicInteger(0);
    private final AtomicInteger warningsCount = new AtomicInteger(0);

    // Customer Purchases Accumulator (cap at 200)
    private final ConcurrentLinkedDeque<CustomerPurchaseSummary> dailyPurchases = new ConcurrentLinkedDeque<>();

    // Customer Searches Accumulator (keyword -> count)
    private final ConcurrentHashMap<String, AtomicInteger> customerSearches = new ConcurrentHashMap<>();

    // Customer Actions Accumulator (cap at 300)
    private final ConcurrentLinkedDeque<CustomerActivitySummary> dailyActivities = new ConcurrentLinkedDeque<>();

    // Scheduling configuration
    private final AtomicReference<DigestScheduleConfig> scheduleConfig = new AtomicReference<>();
    private final AtomicReference<Instant> lastExecutionTime = new AtomicReference<>(null);

    public DailyDigestService(DailyDigestRepository digestRepository, JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.digestRepository = digestRepository;
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        DigestScheduleConfig initialConfig = new DigestScheduleConfig();
        initialConfig.setRecipient("bill.nissim@gmail.com");
        initialConfig.setScheduleType("RECURRING");
        initialConfig.setRecurringFrequency("DAILY");
        initialConfig.setTargetHour(23);
        initialConfig.setTargetMinute(0);
        initialConfig.setTargetDayOfWeek("ALL");
        initialConfig.setActive(true);
        this.scheduleConfig.set(initialConfig);
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

    public void recordCustomerOrder(CustomerPurchaseSummary summary) {
        if (summary == null) return;
        dailyPurchases.addFirst(summary);
        while (dailyPurchases.size() > 200) {
            dailyPurchases.removeLast();
        }
    }

    public void updateCustomerOrderStatus(String orderId, String newStatus) {
        if (orderId == null || newStatus == null) return;
        for (CustomerPurchaseSummary purchase : dailyPurchases) {
            if (orderId.equals(purchase.orderId())) {
                CustomerPurchaseSummary updated = new CustomerPurchaseSummary(
                    purchase.orderId(),
                    purchase.customerId(),
                    purchase.customerEmail(),
                    purchase.items(),
                    purchase.totalAmount(),
                    newStatus,
                    purchase.createdAt()
                );
                dailyPurchases.remove(purchase);
                dailyPurchases.addFirst(updated);
                break;
            }
        }
    }

    public void recordCustomerSearch(String keyword) {
        if (keyword == null || keyword.trim().isBlank()) return;
        String cleanKeyword = keyword.trim().toLowerCase();
        customerSearches.computeIfAbsent(cleanKeyword, k -> new AtomicInteger(0)).incrementAndGet();
        recordCustomerActivity("guest@eventix.io", "CUSTOMER_SEARCH", "Searched catalog for: \"" + cleanKeyword + "\"");
    }

    public void recordCustomerActivity(String email, String action, String details) {
        if (action == null) return;
        String effectiveEmail = (email != null && !email.isBlank()) ? email : "guest@eventix.io";
        CustomerActivitySummary activity = new CustomerActivitySummary(
            UUID.randomUUID().toString(),
            effectiveEmail,
            action,
            details != null ? details : "",
            Instant.now()
        );
        dailyActivities.addFirst(activity);
        while (dailyActivities.size() > 300) {
            dailyActivities.removeLast();
        }
    }

    public DigestScheduleConfig getScheduleConfig() {
        DigestScheduleConfig config = scheduleConfig.get();
        config.setLastRun(lastExecutionTime.get());
        config.setNextRunDescription(computeNextRunDescription(config));
        return config;
    }

    public DigestScheduleConfig updateScheduleConfig(DigestScheduleConfig newConfig) {
        if (newConfig.getRecipient() == null || newConfig.getRecipient().isBlank()) {
            newConfig.setRecipient("bill.nissim@gmail.com");
        }
        scheduleConfig.set(newConfig);
        log.info("Updated Daily Digest schedule: type={}, freq={}, hour={}, min={}, date={}, recipient={}",
            newConfig.getScheduleType(), newConfig.getRecurringFrequency(), newConfig.getTargetHour(),
            newConfig.getTargetMinute(), newConfig.getOneOffDateTime(), newConfig.getRecipient());
        return getScheduleConfig();
    }

    private String computeNextRunDescription(DigestScheduleConfig config) {
        if (!config.isActive() || "DISABLED".equalsIgnoreCase(config.getScheduleType())) {
            return "Scheduling is currently paused / disabled";
        }
        if ("ONE_OFF".equalsIgnoreCase(config.getScheduleType())) {
            return config.getOneOffDateTime() != null ? "One-off dispatch at: " + config.getOneOffDateTime() : "Unscheduled";
        }
        String dayStr = "ALL".equalsIgnoreCase(config.getTargetDayOfWeek()) ? "Every day" : "Weekly on " + config.getTargetDayOfWeek();
        return String.format("%s at %02d:%02d (%s)", dayStr, config.getTargetHour(), config.getTargetMinute(), config.getRecipient());
    }

    // Dynamic scheduler checking every minute
    @Scheduled(cron = "0 * * * * ?")
    public void evaluateDynamicSchedule() {
        DigestScheduleConfig config = scheduleConfig.get();
        if (config == null || !config.isActive() || "DISABLED".equalsIgnoreCase(config.getScheduleType())) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Instant lastRun = lastExecutionTime.get();

        // Guard against duplicate triggers within the same minute
        if (lastRun != null && Duration.between(lastRun, Instant.now()).toSeconds() < 55) {
            return;
        }

        if ("RECURRING".equalsIgnoreCase(config.getScheduleType())) {
            if (now.getHour() == config.getTargetHour() && now.getMinute() == config.getTargetMinute()) {
                if (matchesDayOfWeek(config.getTargetDayOfWeek(), now.getDayOfWeek())) {
                    log.info("Dynamic recurring schedule triggered at {}:{}", now.getHour(), now.getMinute());
                    generateAndSendDigest(config.getRecipient());
                }
            }
        } else if ("ONE_OFF".equalsIgnoreCase(config.getScheduleType())) {
            if (config.getOneOffDateTime() != null && !config.getOneOffDateTime().isBlank()) {
                try {
                    LocalDateTime targetDateTime = LocalDateTime.parse(config.getOneOffDateTime(), DateTimeFormatter.ISO_DATE_TIME);
                    if (now.isAfter(targetDateTime) || (now.toLocalDate().equals(targetDateTime.toLocalDate()) &&
                        now.getHour() == targetDateTime.getHour() && now.getMinute() == targetDateTime.getMinute())) {
                        log.info("Dynamic one-off schedule triggered for {}", config.getOneOffDateTime());
                        generateAndSendDigest(config.getRecipient());
                        // Disable one-off after firing
                        config.setActive(false);
                        config.setScheduleType("COMPLETED");
                    }
                } catch (Exception e) {
                    log.warn("Invalid oneOffDateTime format in schedule config: {}", config.getOneOffDateTime());
                }
            }
        }
    }

    private boolean matchesDayOfWeek(String targetDay, DayOfWeek currentDay) {
        if (targetDay == null || targetDay.isBlank() || "ALL".equalsIgnoreCase(targetDay)) {
            return true;
        }
        return targetDay.trim().toUpperCase().startsWith(currentDay.name().substring(0, 3));
    }

    @Transactional
    public DailyDigestRecord generateAndSendDigest(String recipient) {
        String effectiveRecipient = (recipient != null && !recipient.isBlank()) ? recipient : defaultRecipient;
        LocalDate today = LocalDate.now();
        lastExecutionTime.set(Instant.now());

        int orders = ordersCount.get();
        int confirmed = confirmedCount.get();
        int failed = failedCount.get();
        BigDecimal revenue = totalRevenue.get();
        int errors = errorsCount.get();
        int warnings = warningsCount.get();

        List<CustomerPurchaseSummary> purchases = new ArrayList<>(dailyPurchases);
        Map<String, AtomicInteger> searches = new ConcurrentHashMap<>(customerSearches);
        List<CustomerActivitySummary> activities = new ArrayList<>(dailyActivities);

        String htmlContent = buildHtmlReport(today, orders, confirmed, failed, revenue, errors, warnings, purchases, searches, activities);
        String status = "SENT";
        boolean dispatched = false;

        // 1. First priority: Google Apps Script Webhook (Port 443 HTTPS - Works 100% in Railway Cloud)
        String activeScriptUrl = (googleScriptUrl.get() != null && !googleScriptUrl.get().isBlank())
            ? googleScriptUrl.get()
            : defaultGoogleScriptUrl;

        if (activeScriptUrl != null && !activeScriptUrl.isBlank()) {
            String subject = "📊 Eventix Daily Digest Report - " + today + " | Customer Activity & Purchases";
            Map<String, Object> webhookRes = dispatchViaGoogleScript(effectiveRecipient, subject, htmlContent);
            if (Boolean.TRUE.equals(webhookRes.get("success"))) {
                dispatched = true;
                status = "SENT (via Google Cloud Webhook)";
                log.info("Successfully sent Daily Digest email via Google Cloud Webhook from {} to {}", defaultSender, effectiveRecipient);
            } else {
                log.warn("Google Cloud Webhook failed, attempting SMTP fallback: {}", webhookRes.get("message"));
            }
        }

        // 2. Fallback: Direct SMTP (Port 587/465)
        if (!dispatched) {
            if (mailSender instanceof JavaMailSenderImpl impl) {
                if (impl.getPassword() == null || impl.getPassword().isBlank()) {
                    String senderEmail = (impl.getUsername() != null && !impl.getUsername().isBlank()) ? impl.getUsername() : defaultSender;
                    String errorMsg = "Neither Google Cloud Webhook nor Google App Password is ready for " + senderEmail + ".";
                    log.warn("Cannot send email: {}", errorMsg);
                    status = "FAILED: " + errorMsg;

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
            }

            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(defaultSender, "Project Eventix Operations");
                helper.setTo(effectiveRecipient);
                helper.setSubject("📊 Eventix Daily Digest Report - " + today + " | Customer Activity & Purchases");
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("Successfully sent Daily Digest email from {} to {}", defaultSender, effectiveRecipient);
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                log.error("Failed to send Daily Digest email to {}: {}", effectiveRecipient, errorMsg, e);
                status = "FAILED: " + (errorMsg.length() > 200 ? errorMsg.substring(0, 200) : errorMsg);
            }
        }

        DailyDigestRecord record = digestRepository.findByReportDate(today)
            .orElseGet(DailyDigestRecord::new);

        if (record.getId() == null) {
            record.setId(UUID.randomUUID().toString());
        }
        record.setReportDate(today);
        record.setTotalOrders(orders);
        record.setConfirmedOrders(confirmed);
        record.setFailedOrders(failed);
        record.setTotalRevenue(revenue);
        record.setTotalErrors(errors);
        record.setTotalWarnings(warnings);
        record.setEmailRecipient(effectiveRecipient);
        record.setStatus(status);
        record.setGeneratedAt(Instant.now());

        try {
            return digestRepository.save(record);
        } catch (Exception e) {
            log.error("Failed to persist digest record to database: {}", e.getMessage(), e);
            return record;
        }
    }

    public SmtpConfigDto getSmtpConfig() {
        String activeScriptUrl = (googleScriptUrl.get() != null && !googleScriptUrl.get().isBlank())
            ? googleScriptUrl.get()
            : defaultGoogleScriptUrl;

        if (mailSender instanceof JavaMailSenderImpl impl) {
            String effectiveUser = (impl.getUsername() != null && !impl.getUsername().isBlank()) ? impl.getUsername() : "nati.nissim@gmail.com";
            boolean hasUser = impl.getUsername() != null && !impl.getUsername().isBlank();
            boolean hasPass = impl.getPassword() != null && !impl.getPassword().isBlank();
            boolean configured = hasPass || (activeScriptUrl != null && !activeScriptUrl.isBlank());
            SmtpConfigDto dto = new SmtpConfigDto(
                impl.getHost() != null ? impl.getHost() : "smtp.gmail.com",
                impl.getPort() > 0 ? impl.getPort() : 587,
                effectiveUser,
                hasPass ? "••••••••••••••••" : "",
                true,
                true,
                configured
            );
            dto.setGoogleScriptUrl(activeScriptUrl);
            return dto;
        }
        SmtpConfigDto fallback = new SmtpConfigDto("smtp.gmail.com", 587, "nati.nissim@gmail.com", "", true, true, activeScriptUrl != null && !activeScriptUrl.isBlank());
        fallback.setGoogleScriptUrl(activeScriptUrl);
        return fallback;
    }

    public SmtpConfigDto updateSmtpConfig(SmtpConfigDto dto) {
        if (dto.getGoogleScriptUrl() != null) {
            googleScriptUrl.set(dto.getGoogleScriptUrl().trim());
            log.info("Updated Google Apps Script URL: {}", googleScriptUrl.get());
        }
        if (mailSender instanceof JavaMailSenderImpl impl) {
            if (dto.getHost() != null && !dto.getHost().isBlank()) {
                impl.setHost(dto.getHost().trim());
            }
            if (dto.getPort() > 0) {
                impl.setPort(dto.getPort());
            }
            if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
                String cleanUser = dto.getUsername().trim();
                impl.setUsername(cleanUser);
                if (cleanUser.contains("@")) {
                    this.defaultSender = cleanUser;
                }
            }
            if (dto.getPassword() != null && !dto.getPassword().isBlank() && !dto.getPassword().contains("••••")) {
                String cleanPass = dto.getPassword().replaceAll("\\s+", "").trim();
                impl.setPassword(cleanPass);
            }
            Properties props = impl.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            if (impl.getPort() == 465) {
                props.put("mail.smtp.ssl.enable", "true");
                props.put("mail.smtp.socketFactory.port", "465");
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
                props.put("mail.smtp.starttls.enable", "false");
            } else {
                props.put("mail.smtp.ssl.enable", "false");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.starttls.required", "true");
            }
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.ssl.trust", impl.getHost() != null ? impl.getHost() : "smtp.gmail.com");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");
            impl.setJavaMailProperties(props);
            log.info("Updated dynamic SMTP configuration: host={}, port={}, user={}, passConfigured={}",
                impl.getHost(), impl.getPort(), impl.getUsername(), impl.getPassword() != null && !impl.getPassword().isBlank());
        }
        return getSmtpConfig();
    }

    public Map<String, Object> testSmtpConnection(String recipient) {
        String testTarget = (recipient != null && !recipient.isBlank()) ? recipient : defaultRecipient;
        String activeScriptUrl = (googleScriptUrl.get() != null && !googleScriptUrl.get().isBlank())
            ? googleScriptUrl.get()
            : defaultGoogleScriptUrl;

        // 1. If Google Apps Script Webhook is configured, test via HTTPS port 443
        if (activeScriptUrl != null && !activeScriptUrl.isBlank()) {
            String subject = "✅ Eventix Cloud Email Connection Verified";
            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;'>"
                + "<h2 style='color: #059669; margin-top: 0;'>✅ Eventix Cloud Email Connection Verified</h2>"
                + "<p style='font-size: 15px; line-height: 1.6;'>Congratulations! This automated test confirms that Project Eventix is successfully connected to your Google Cloud Webhook and can deliver real emails directly from <strong>" + defaultSender + "</strong> to <strong>" + testTarget + "</strong> without any local server dependencies.</p>"
                + "<div style='background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;'>"
                + "  <strong style='color: #065f46;'>Status:</strong> <span style='color: #047857;'>100% Autonomous Cloud Operation Active on Railway</span>"
                + "</div>"
                + "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'/>"
                + "<p style='font-size: 12px; color: #64748b;'>Project Eventix Operations • Dispatched via Google Cloud Webhook</p>"
                + "</div>";

            Map<String, Object> scriptResult = dispatchViaGoogleScript(testTarget, subject, htmlContent);
            if (Boolean.TRUE.equals(scriptResult.get("success"))) {
                return scriptResult;
            }
            log.warn("Google Apps Script test failed, attempting SMTP fallback: {}", scriptResult.get("message"));
        }

        // 2. SMTP fallback
        if (mailSender instanceof JavaMailSenderImpl impl) {
            if (impl.getPassword() == null || impl.getPassword().isBlank()) {
                return Map.of(
                    "success", false,
                    "message", "Neither Google Apps Script URL nor Google App Password is configured. Please verify your settings."
                );
            }
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            String sender = defaultSender;
            if (mailSender instanceof JavaMailSenderImpl impl && impl.getUsername() != null && !impl.getUsername().isBlank()) {
                sender = impl.getUsername();
            }
            helper.setFrom(sender);
            helper.setTo(testTarget);
            helper.setSubject("✅ Eventix SMTP Connection Verified");
            helper.setText("Congratulations! This automated test confirms that Project Eventix is successfully connected to your SMTP mail server (" + sender + ") and can deliver real emails directly to " + testTarget + ".");
            mailSender.send(message);
            log.info("Successfully sent SMTP test email from {} to {}", sender, testTarget);
            return Map.of("success", true, "message", "SMTP connection verified! Test email successfully sent from " + sender + " to " + testTarget);
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            Throwable cause = e.getCause();
            if (cause != null && cause.getMessage() != null) {
                errorMsg = errorMsg + " -> " + cause.getMessage();
            }
            log.error("SMTP connection test failed to {}: {}", testTarget, errorMsg, e);
            return Map.of("success", false, "message", "SMTP test failed: " + errorMsg);
        }
    }

    public Map<String, Object> dispatchViaGoogleScript(String targetRecipient, String subject, String htmlContent) {
        String url = (googleScriptUrl.get() != null && !googleScriptUrl.get().isBlank())
            ? googleScriptUrl.get()
            : defaultGoogleScriptUrl;

        if (url == null || url.isBlank()) {
            return Map.of("success", false, "message", "Google Apps Script Webhook URL is not configured.");
        }

        try {
            String cleanSubject = (subject != null ? subject.replaceAll("[\\u0590-\\u05FF]", "").trim() : "Eventix Notification");
            String cleanHtml = (htmlContent != null ? htmlContent.replaceAll("[\\u0590-\\u05FF]", "").trim() : "");

            Map<String, String> payload = Map.of(
                "to", targetRecipient,
                "subject", cleanSubject,
                "htmlBody", cleanHtml
            );
            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            log.info("Google Apps Script response status: {}, body: {}", response.statusCode(), response.body());

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                return Map.of("success", true, "message", "Email successfully dispatched from " + defaultSender + " to " + targetRecipient + " via Google Cloud Webhook!");
            } else {
                return Map.of("success", false, "message", "Google Apps Script returned HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            log.error("Failed to dispatch email via Google Apps Script: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "Google Apps Script dispatch failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<DailyDigestRecord> getDigestHistory() {
        return digestRepository.findAllByOrderByReportDateDesc();
    }

    public List<CustomerPurchaseSummary> getDailyPurchases() {
        return new ArrayList<>(dailyPurchases);
    }

    public Map<String, Integer> getCustomerSearches() {
        Map<String, Integer> res = new ConcurrentHashMap<>();
        customerSearches.forEach((k, v) -> res.put(k, v.get()));
        return res;
    }

    public List<CustomerActivitySummary> getDailyActivities() {
        return new ArrayList<>(dailyActivities);
    }

    private String buildHtmlReport(
        LocalDate date,
        int orders,
        int confirmed,
        int failed,
        BigDecimal revenue,
        int errors,
        int warnings,
        List<CustomerPurchaseSummary> purchases,
        Map<String, AtomicInteger> searches,
        List<CustomerActivitySummary> activities
    ) {
        StringBuilder purchasesHtml = new StringBuilder();
        if (purchases.isEmpty()) {
            purchasesHtml.append("<tr><td colspan='5' style='padding: 12px; text-align: center; color: #94a3b8; font-style: italic;'>No customer purchases recorded today.</td></tr>");
        } else {
            for (CustomerPurchaseSummary p : purchases) {
                StringBuilder itemsStr = new StringBuilder();
                if (p.items() != null && !p.items().isEmpty()) {
                    for (CustomerPurchaseSummary.ItemSummary it : p.items()) {
                        String cleanName = it.productName() != null ? it.productName().replaceAll("[\\u0590-\\u05FF]", "").trim() : "Standard Item";
                        if (cleanName.isBlank()) cleanName = "Standard Item";
                        itemsStr.append("<span style='display:block; font-size: 11px; color: #cbd5e1;'>• ")
                            .append(cleanName).append(" (x").append(it.quantity()).append(") - $")
                            .append(it.unitPrice() != null ? it.unitPrice().toPlainString() : "0.00").append("</span>");
                    }
                } else {
                    itemsStr.append("<span style='font-size: 11px; color: #94a3b8;'>Items details pending</span>");
                }

                String statusColor = "CONFIRMED".equalsIgnoreCase(p.status()) ? "#4ade80" : ("FAILED".equalsIgnoreCase(p.status()) ? "#f87171" : "#fbbf24");

                purchasesHtml.append("<tr style='border-bottom: 1px solid #334155;'>")
                    .append("<td style='padding: 10px; font-family: monospace; color: #38bdf8;'>#").append(p.orderId() != null && p.orderId().length() > 10 ? p.orderId().substring(0, 10) + "..." : p.orderId()).append("</td>")
                    .append("<td style='padding: 10px; color: #f8fafc;'>").append(p.customerEmail() != null ? p.customerEmail() : "guest@eventix.io").append("</td>")
                    .append("<td style='padding: 10px;'>").append(itemsStr).append("</td>")
                    .append("<td style='padding: 10px; font-weight: bold; color: #4ade80;'>$").append(p.totalAmount() != null ? p.totalAmount().toPlainString() : "0.00").append("</td>")
                    .append("<td style='padding: 10px;'><span style='color: ").append(statusColor).append("; font-weight: bold; font-size: 11px;'>").append(p.status()).append("</span></td>")
                    .append("</tr>");
            }
        }

        StringBuilder searchesHtml = new StringBuilder();
        if (searches.isEmpty()) {
            searchesHtml.append("<p style='color: #94a3b8; font-size: 12px; font-style: italic;'>No catalog search terms recorded today.</p>");
        } else {
            searchesHtml.append("<div style='display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;'>");
            searches.forEach((k, v) -> {
                String cleanKey = k != null ? k.replaceAll("[\\u0590-\\u05FF]", "").trim() : "Catalog Query";
                if (cleanKey.isBlank()) cleanKey = "Catalog Query";
                searchesHtml.append("<span style='background: #1e293b; border: 1px solid #475569; padding: 4px 10px; border-radius: 20px; font-size: 12px; color: #38bdf8;'>")
                    .append("🔍 \"").append(cleanKey).append("\" (").append(v.get()).append(" searches)</span> ");
            });
            searchesHtml.append("</div>");
        }

        StringBuilder activitiesHtml = new StringBuilder();
        if (activities.isEmpty()) {
            activitiesHtml.append("<tr><td colspan='3' style='padding: 12px; text-align: center; color: #94a3b8; font-style: italic;'>No customer activity recorded today.</td></tr>");
        } else {
            int count = 0;
            for (CustomerActivitySummary act : activities) {
                if (count++ >= 20) break; // Display top 20 latest activities
                String cleanAct = act.action() != null ? act.action().replaceAll("[\\u0590-\\u05FF]", "").trim() : "ACTIVITY";
                String cleanDetails = act.details() != null ? act.details().replaceAll("[\\u0590-\\u05FF]", "").trim() : "";
                activitiesHtml.append("<tr style='border-bottom: 1px solid #334155;'>")
                    .append("<td style='padding: 8px 10px; font-size: 11px; color: #94a3b8; font-family: monospace;'>").append(act.timestamp() != null ? act.timestamp().toString().substring(11, 19) : "").append("</td>")
                    .append("<td style='padding: 8px 10px; font-size: 11px; font-weight: bold; color: #38bdf8;'>").append(cleanAct).append("</td>")
                    .append("<td style='padding: 8px 10px; font-size: 11px; color: #cbd5e1;'>").append(cleanDetails).append(" <span style='color: #64748b;'>(").append(act.customerEmail()).append(")</span></td>")
                    .append("</tr>");
            }
        }

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 24px; }
                    .container { max-width: 780px; margin: 0 auto; background: #111827; border-radius: 16px; padding: 32px; border: 1px solid #1f2937; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
                    .header { text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 24px; margin-bottom: 24px; }
                    .header h1 { color: #38bdf8; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
                    .date { color: #94a3b8; font-size: 14px; margin-top: 6px; }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); margin-top: 10px; }
                    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 24px 0; }
                    .card { background: #1f2937; padding: 16px; border-radius: 12px; border: 1px solid #374151; }
                    .card-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
                    .card-value { font-size: 20px; font-weight: bold; margin-top: 6px; }
                    .val-revenue { color: #34d399; }
                    .val-orders { color: #38bdf8; }
                    .val-errors { color: #f87171; }
                    .val-warnings { color: #fbbf24; }
                    .section-title { font-size: 16px; font-weight: bold; color: #ffffff; margin: 28px 0 12px 0; border-left: 4px solid #38bdf8; padding-left: 10px; display: flex; align-items: center; justify-content: space-between; }
                    table { width: 100%%; border-collapse: collapse; background: #1f2937; border-radius: 12px; overflow: hidden; font-size: 12px; }
                    th { background: #0f172a; padding: 10px; text-align: left; color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: bold; }
                    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚡ Project Eventix - Executive Daily Digest</h1>
                        <div class="date">Daily Operations & Customer Activity Summary for <strong>%s</strong></div>
                        <div class="badge">Dispatched directly to: %s</div>
                    </div>

                    <!-- KPI Statistics Grid -->
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

                    <!-- Section 1: Customer Purchases Breakdown -->
                    <div class="section-title">
                        🛒 Customer Purchases Surveillance (%d recorded)
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Email</th>
                                <th>Purchased Items</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            %s
                        </tbody>
                    </table>

                    <!-- Section 2: Customer Catalog Searches -->
                    <div class="section-title">
                        🔍 Store Catalog Searches (%d unique queries)
                    </div>
                    <div style="background: #1f2937; padding: 16px; border-radius: 12px; border: 1px solid #374151;">
                        %s
                    </div>

                    <!-- Section 3: Customer Actions & Activity Log -->
                    <div class="section-title">
                        ⚡ Customer Operations & Activity Stream (Latest 20)
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Customer & Operation Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            %s
                        </tbody>
                    </table>

                    <div class="footer">
                        Automated Daily Security & Operations Digest &bull; Project Eventix Microservices Architecture &bull; Mailpit SMTP Integration
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                date,
                defaultRecipient,
                revenue.toPlainString(),
                orders,
                confirmed,
                failed,
                errors,
                warnings,
                purchases.size(),
                purchasesHtml.toString(),
                searches.size(),
                searchesHtml.toString(),
                activitiesHtml.toString()
            );
    }
}
