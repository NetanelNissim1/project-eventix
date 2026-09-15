package com.eventix.audit.service;

import java.util.regex.Pattern;

public final class DataMaskingUtil {
    private DataMaskingUtil() {}

    // Mask credit cards: 16 digits (with or without spaces/dashes)
    private static final Pattern CARD_PATTERN = Pattern.compile("\\b(?:\\d[ -]*?){13,16}\\b");

    // Mask passwords / tokens in JSON or text
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("(?i)(\"?(password|secret|token|apiKey|authorization)\"?\\s*[:=]\\s*\"?)([^\"\\s,}{]+)(\"?)");

    public static String mask(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        // Mask passwords
        String masked = PASSWORD_PATTERN.matcher(input).replaceAll("$1********$4");
        // Mask card numbers
        masked = CARD_PATTERN.matcher(masked).replaceAll("****-****-****-****");
        return masked;
    }
}
