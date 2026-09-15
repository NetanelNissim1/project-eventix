# Project State Snapshot: Project Eventix

### Project Scope & Architecture
Project Eventix is a high-concurrency, event-driven e-commerce platform built with a Java 21 / Spring Boot 3 multi-project backend and a React 18 / TypeScript / Tailwind CSS Single Page Application (SPA). The backend utilizes the Choreography Saga Pattern via Apache Kafka (KRaft), Debezium Change Data Capture (Transactional Outbox Pattern), PostgreSQL (per-service schemas), Redis 7 (Token Bucket rate limiting, distributed locking via Redisson, and caching), and Spring WebSocket / STOMP. Client communication routes through a Spring Cloud Gateway (port 8080) enforcing correlation ID tracing, JWT authentication, and edge rate limits.

---

### Completed Components

#### 1. Backend Microservices (`c:\projects\project-eventix\`)
- **Root Multi-Project Build**: `settings.gradle.kts` and `build.gradle.kts` orchestrating 9 modules on Gradle 8.10.2 and Java 21 toolchain.
- **Infrastructure Orchestration (`docker-compose.yml`)**:
  - Apache Kafka (`confluentinc/cp-kafka:7.6.0`) in KRaft mode (ports `9092`, `29092`).
  - Debezium Kafka Connect (`debezium/connect:2.6`) capturing PostgreSQL WAL via `pgoutput` plugin.
  - PostgreSQL 16 (`docker/postgres/init-db.sql`) with dedicated databases: `order_db`, `inventory_db`, `payment_db`, `catalog_db`, `audit_db`, `digest_db`, `keycloak_db`.
  - Redis 7 (`redis:7.2-alpine`, port `6379`).
  - Keycloak 24 (`quay.io/keycloak/keycloak:24.0.5`, port `8089:8080`, realm import `docker/keycloak/realm-export.json`).
  - Mailpit (`axllent/mailpit:latest`, ports `1025` SMTP, `8025` Web UI).
  - Kafka UI (`provectuslabs/kafka-ui:latest`, port `8090`).
- **`common-dto`**:
  - Events: `OrderCreatedEvent`, `InventoryReservedEvent`, `PaymentCompletedEvent`, `OrderStatusUpdateEvent`, `AuditEvent`.
  - DTOs: `OrderItemDto`, `PaymentDetailsDto`.
  - Constants: `KafkaTopics`.
- **`api-gateway` (Port 8080)**:
  - Spring Cloud Gateway routing rules for all 7 downstream services, STOMP WebSockets (`/ws-eventix/**`), and Keycloak (`/realms/**`).
  - `CorrelationIdFilter`: Generates or passes `X-Correlation-Id`.
  - Redis Token Bucket `RequestRateLimiter` (`replenishRate: 50`, `burstCapacity: 100`).
- **`catalog-service` (Port 8081)**:
  - `CatalogController`: `GET /api/v1/products`, `GET /api/v1/products/{id}`, `GET /api/v1/categories`.
  - Spring Redis caching (`@Cacheable(value = "products")`, `@CacheEvict`).
  - `DataInitializer`: Pre-populates catalog products (`prod-101` to `prod-104`).
- **`order-service` (Port 8082)**:
  - `OrderController`: `POST /api/v1/orders`, `GET /api/v1/orders/{orderId}`, `GET /api/v1/orders/customer/{customerId}`.
  - Transactional Outbox pattern: Atomic dual-write into `orders` and `outbox_events` tables inside single `@Transactional`.
  - Saga listener handling compensation events (`order-failed`).
- **`inventory-service` (Port 8083)**:
  - `InventoryController`: `GET /api/v1/inventory`, `POST /api/v1/inventory/restock`.
  - `InventoryService`: Redisson `RLock` distributed locking ordered by `productId` to prevent deadlocks and overselling during stock reservation.
  - `InventoryDataInitializer`: Pre-populates stock inventory for `prod-101` through `prod-106`.
- **`payment-service` (Port 8084)**:
  - `PaymentConsumer`: Idempotent Kafka consumer listening on `inventory-reserved`, recording processed keys in `processed_payments`.
- **`notification-service` (Port 8085)**:
  - `WebSocketConfig`: STOMP message broker on `/ws-eventix` broadcasting to `/topic/orders` and `/topic/orders/{orderId}`.
- **`audit-logging-service` (Port 8086)**:
  - Kafka consumer consuming `audit-events`.
  - `DataMaskingUtil`: PCI-DSS/GDPR compliant regex masking for credit cards, emails, and phone numbers.
  - `AuditController`: `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/stats`.
- **`daily-digest-service` (Port 8087)**:
  - `@Scheduled(cron = "0 0 23 * * *")` batch processing aggregating daily revenue and order metrics.
  - `DailyDigestController`: `POST /api/v1/digest/trigger-now`, `GET /api/v1/digest/history`.
  - HTML email generator sending via `JavaMailSender` to Mailpit (port 1025).

#### 2. Frontend Application (`c:\projects\project-eventix\frontend-client\`)
- **Build Tooling & Routing**: Vite 5.4.21, React Router v6, TypeScript 5.5, Tailwind CSS 3.4.
- **Network Proxy (`vite.config.ts`)**: Proxies `/api` and WebSocket `/ws-eventix` to `http://localhost:8080`.
- **API Interceptor (`src/api/client.ts`)**: Injects `Authorization: Bearer <token>` and auto-generates `X-Correlation-Id` UUID per request.
- **State Stores**:
  - `useAuthStore`: Token, user metadata, role checks, `localStorage` persistence.
  - `useCartStore`: Reactive cart, subtotal/tax calculations, `localStorage` persistence.
  - `useWishlistStore`: Wishlist items management, `localStorage` persistence.
- **Complete Page Catalog**:
  1. `HomePage.tsx` (`/`): Landing page, trending products, architecture badges.
  2. `CatalogPage.tsx` (`/products`): Category filters, full-text search, price filter, stock alerts, Wishlist toggles.
  3. `ProductDetailPage.tsx` (`/products/:id`): Gallery, quantity selector, add-to-cart, instant checkout, Wishlist button.
  4. `CartPage.tsx` (`/cart`): Quantity modifier, tax/shipping totals, checkout navigation.
  5. `CheckoutPage.tsx` (`/checkout`): Protected checkout, address, mock card processing, `Idempotency-Key` generation.
  6. `OrderStatusPage.tsx` (`/orders/:id/status`): Real-time `@stomp/stompjs` WebSocket client tracking 4-step Saga progression and automated compensations.
  7. `OrderConfirmationPage.tsx` (`/orders/:id/confirmation`): Printable tax invoice / receipt with order reference.
  8. `WishlistPage.tsx` (`/wishlist`): Saved items grid with single and bulk "Move to Cart".
  9. `LoginPage.tsx` (`/login`): Customer & Admin instant login, RFC 7519 token generation, redirect preserve.
  10. `RegisterPage.tsx` (`/register`): Password validation rules and instant profile provision.
  11. `ForgotPasswordPage.tsx` (`/forgot-password`, `/reset-password`).
  12. `OrderHistoryPage.tsx` (`/account/orders`): Protected customer orders list.
  13. `ProfilePage.tsx` (`/account/profile`): User security and personal settings.
  14. `SystemHealthPage.tsx` (`/system-health`): Live dashboard monitoring all 8 microservices, ports, latencies, Kafka, and Redis.
  15. `SupportFaqPage.tsx` (`/support`, `/faq`): Technical FAQ accordion and support ticket submission form.
  16. `AuditPage.tsx` (`/audit`): Admin console for masked security logs.
  17. `DigestPage.tsx` (`/digest`): Daily digest history and manual email trigger.
  18. `NotFoundPage.tsx` (`*`): Branded 404 handler.

---

### Key Decisions & Hard Constraints

#### Architectural Choices Locked In
- **Language & Runtime**: Java 21 LTS toolchain with Gradle 8.10.2 multi-project layout.
- **Saga Pattern**: Choreography Saga using Apache Kafka topics: `order-created`, `inventory-reserved`, `payment-completed`, `order-completed`, `inventory-failed`, `payment-failed`.
- **Outbox Pattern**: Transactional Outbox (`outbox_events` table) read via Debezium CDC Connect using PostgreSQL WAL logical replication (`pgoutput`).
- **Distributed Locking**: Redisson `RLock` on key `lock:inventory:{productId}` with 5s wait / 10s lease time.
- **Rate Limiting**: Spring Cloud Gateway Redis Token Bucket rate limiter (50 replenish / 100 burst).
- **Masking & Security**: Regex PII redaction (`DataMaskingUtil`) in `audit-logging-service` before DB insertion; zero hardcoded credentials.

#### Strict 'Do Nots' & Constraints
- **Do NOT** use `npm` directly in PowerShell on this machine (fails on execution policy); always execute `npm.cmd`.
- **Do NOT** write UTF-8 with BOM (`\ufeff`); use direct file writers without BOM to prevent Java compilation errors.
- **Do NOT** bind Keycloak to port 8081 (occupied by `catalog-service`); Keycloak is strictly locked to host port `8089`.
- **Do NOT** bypass the API Gateway (port 8080) for client-to-backend communication.
- **Do NOT** implement two-phase commit (2PC) or monolithic shared databases across services; each service owns its database.

---

### Current Status (Where We Left Off)
- **Frontend Build**: `npm.cmd run build` inside `c:\projects\project-eventix\frontend-client` compiled with exit code 0 (`tsc && vite build` clean, 1603 modules transformed).
- **Backend Build**: `.\gradlew.bat assemble` inside `c:\projects\project-eventix` succeeded with exit code 0 across all 9 subprojects.
- **Frontend Dev Server**: Active in the background on `http://localhost:5173` (HTTP 200).
- **All 18 routes**: Fully wired into `src/App.tsx`, verified with TypeScript strict types.

---

### Immediate Next Task
Run the local Docker infrastructure stack via `docker compose up -d` (using `C:\Program Files\Docker\Docker\resources\bin\docker.exe` or terminal with updated PATH) and launch the backend services to execute an end-to-end checkout flow from `http://localhost:5173`.
