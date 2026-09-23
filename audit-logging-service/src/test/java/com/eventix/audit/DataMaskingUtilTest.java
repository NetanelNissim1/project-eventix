package com.eventix.audit;

import com.eventix.audit.service.DataMaskingUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DataMaskingUtil Unit Tests - PII, Sensitive Headers & Card Masking")
class DataMaskingUtilTest {

    @Test
    @DisplayName("Should mask credit cards with spaces or hyphens")
    void testMaskingCreditCards() {
        String input = "User charged card 4580 1234 5678 9012 for total $120";
        String masked = DataMaskingUtil.mask(input);

        assertThat(masked).doesNotContain("4580 1234 5678 9012");
        assertThat(masked).contains("****-****-****-****");

        String dashedInput = "Card 4580-1234-5678-9012 authorized";
        assertThat(DataMaskingUtil.mask(dashedInput)).contains("****-****-****-****");
    }

    @Test
    @DisplayName("Should mask passwords, secret tokens, and API keys in JSON payloads")
    void testMaskingPasswordAndToken() {
        String jsonPayload = "{\"username\": \"admin\", \"password\": \"SuperSecret123!\", \"token\": \"jwt-abc-xyz\", \"apiKey\": \"key-998877\"}";
        String masked = DataMaskingUtil.mask(jsonPayload);

        assertThat(masked).doesNotContain("SuperSecret123!");
        assertThat(masked).doesNotContain("jwt-abc-xyz");
        assertThat(masked).doesNotContain("key-998877");
        assertThat(masked).contains("\"password\": \"********\"");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "\t\n"})
    @DisplayName("Edge Case: Blank and empty inputs should return as-is without exceptions")
    void testBlankAndEmptyInputs(String input) {
        assertThat(DataMaskingUtil.mask(input)).isEqualTo(input);
    }

    @Test
    @DisplayName("Edge Case: Null input should safely return null")
    void testNullInputSafety() {
        assertThat(DataMaskingUtil.mask(null)).isNull();
    }

    @Test
    @DisplayName("Harmless text without PII should remain unaltered")
    void testCleanInputUnchanged() {
        String clean = "Order #12345 placed for customer John Doe with 2 items.";
        assertThat(DataMaskingUtil.mask(clean)).isEqualTo(clean);
    }
}
