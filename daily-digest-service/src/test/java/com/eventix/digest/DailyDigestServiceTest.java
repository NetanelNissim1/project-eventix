package com.eventix.digest;

import com.eventix.digest.dto.DigestScheduleConfig;
import com.eventix.digest.entity.DailyDigestRecord;
import com.eventix.digest.repository.DailyDigestRepository;
import com.eventix.digest.service.DailyDigestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DailyDigestService Unit Tests - Aggregation, Scheduling & English Sanitization")
class DailyDigestServiceTest {

    @Mock
    private DailyDigestRepository digestRepository;

    @Mock
    private JavaMailSender mailSender;

    private DailyDigestService digestService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        digestService = new DailyDigestService(digestRepository, mailSender, objectMapper);
    }

    @Test
    @DisplayName("Accumulators: Should record customer searches and increment counts accurately")
    void testRecordCustomerSearch() {
        // Act
        digestService.recordCustomerSearch("Wireless Headphones");
        digestService.recordCustomerSearch("wireless headphones"); // normalized
        digestService.recordCustomerSearch("Smart TV");

        // Assert
        Map<String, Integer> searches = digestService.getCustomerSearches();
        assertThat(searches).containsEntry("wireless headphones", 2);
        assertThat(searches).containsEntry("smart tv", 1);
    }

    @Test
    @DisplayName("Accumulators: Should record customer activities up to max queue capacity")
    void testRecordCustomerActivity() {
        // Act
        digestService.recordCustomerActivity("user1@eventix.io", "VIEW_PRODUCT", "Viewed Sony WH-1000XM5");
        digestService.recordCustomerActivity("user2@eventix.io", "ADD_TO_CART", "Added Bose QC Ultra to cart");

        // Assert
        var activities = digestService.getDailyActivities();
        assertThat(activities).hasSize(2);
        // Latest activity is at head of deque
        assertThat(activities.get(0).action()).isEqualTo("ADD_TO_CART");
        assertThat(activities.get(0).customerEmail()).isEqualTo("user2@eventix.io");
        assertThat(activities.get(1).action()).isEqualTo("VIEW_PRODUCT");
        assertThat(activities.get(1).customerEmail()).isEqualTo("user1@eventix.io");
    }

    @Test
    @DisplayName("Idempotency: generateAndSendDigest should update existing record if date already exists")
    void testGenerateAndSendDigestUpsertLogic() {
        // Arrange
        LocalDate today = LocalDate.now();
        DailyDigestRecord existingRecord = new DailyDigestRecord();
        existingRecord.setId("existing-uuid-123");
        existingRecord.setReportDate(today);

        when(digestRepository.findByReportDate(today)).thenReturn(Optional.of(existingRecord));
        when(digestRepository.save(any(DailyDigestRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        DailyDigestRecord result = digestService.generateAndSendDigest("bill.nissim@gmail.com");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("existing-uuid-123");
        verify(digestRepository).save(existingRecord);
    }

    @Test
    @DisplayName("Scheduler: Should save and update active email dispatch schedule configuration")
    void testUpdateScheduleConfig() {
        // Arrange
        DigestScheduleConfig config = new DigestScheduleConfig();
        config.setActive(true);
        config.setRecipient("bill.nissim@gmail.com");
        config.setScheduleType("RECURRING");
        config.setTargetDayOfWeek("MON");
        config.setTargetHour(9);
        config.setTargetMinute(30);

        // Act
        DigestScheduleConfig updated = digestService.updateScheduleConfig(config);

        // Assert
        assertThat(updated.isActive()).isTrue();
        assertThat(updated.getRecipient()).isEqualTo("bill.nissim@gmail.com");
        assertThat(updated.getNextRunDescription()).contains("MON at 09:30");
    }
}
