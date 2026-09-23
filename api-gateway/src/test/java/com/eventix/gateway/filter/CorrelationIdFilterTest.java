package com.eventix.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@DisplayName("CorrelationIdFilter Unit Tests - Distributed Tracing Filter")
class CorrelationIdFilterTest {

    private CorrelationIdFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CorrelationIdFilter();
    }

    @Test
    @DisplayName("Filter generates and injects correlation ID when missing from incoming request")
    void testInjectsCorrelationIdWhenMissing() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicBoolean chainExecuted = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            chainExecuted.set(true);
            String headerInChain = ex.getRequest().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_ID_HEADER);
            assertThat(headerInChain).isNotBlank();
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainExecuted.get()).isTrue();
        String responseHeader = exchange.getResponse().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_ID_HEADER);
        assertThat(responseHeader).isNotBlank();
    }

    @Test
    @DisplayName("Filter preserves existing correlation ID if already provided in incoming request")
    void testPreservesExistingCorrelationId() {
        String existingId = "req-custom-trace-uuid-12345";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/catalog")
            .header(CorrelationIdFilter.CORRELATION_ID_HEADER, existingId)
            .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicBoolean chainExecuted = new AtomicBoolean(false);
        GatewayFilterChain chain = ex -> {
            chainExecuted.set(true);
            String headerInChain = ex.getRequest().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_ID_HEADER);
            assertThat(headerInChain).isEqualTo(existingId);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainExecuted.get()).isTrue();
        String responseHeader = exchange.getResponse().getHeaders().getFirst(CorrelationIdFilter.CORRELATION_ID_HEADER);
        assertThat(responseHeader).isEqualTo(existingId);
    }

    @Test
    @DisplayName("Filter order has highest precedence")
    void testGetOrder() {
        assertThat(filter.getOrder()).isEqualTo(Ordered.HIGHEST_PRECEDENCE);
    }
}
