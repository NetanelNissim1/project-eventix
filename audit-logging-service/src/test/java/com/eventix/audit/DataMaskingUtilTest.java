package com.eventix.audit;

import com.eventix.audit.service.DataMaskingUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DataMaskingUtilTest {

    @Test
    void testMaskingCreditCards() {
        String input = "User charged card 4580 1234 5678 9012 for total $120";
        String masked = DataMaskingUtil.mask(input);

        assertThat(masked).doesNotContain("4580 1234 5678 9012");
        assertThat(masked).contains("****-****-****-****");
    }

    @Test
    void testMaskingPasswordAndToken() {
        String jsonPayload = "{\"username\": \"admin\", \"password\": \"SuperSecret123!\", \"token\": \"jwt-abc-xyz\"}";
        String masked = DataMaskingUtil.mask(jsonPayload);

        assertThat(masked).doesNotContain("SuperSecret123!");
        assertThat(masked).doesNotContain("jwt-abc-xyz");
        assertThat(masked).contains("********");
    }
}
