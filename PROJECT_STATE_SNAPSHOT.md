# Project State Snapshot: Project Eventix

### Project Scope & Architecture
Project Eventix is a high-concurrency, event-driven e-commerce platform built with a Java 21 / Spring Boot 3 multi-project backend and a React 18 / TypeScript / Tailwind CSS Single Page Application (SPA). The backend orchestrates the Choreography Saga Pattern via Apache Kafka 3.7 (KRaft mode), Debezium Change Data Capture (Transactional Outbox Pattern), PostgreSQL 16 (per-service segregated databases), Redis 7.2 (Token Bucket edge rate limiting, Redisson distributed locking, and cache abstraction), and Spring STOMP WebSockets. Client traffic is centrally routed through a Spring Cloud Gateway (port 8080) enforcing `X-Correlation-Id` tracing, JWT authentication, and edge burst controls.

---

### Completed Components

#### 1. Backend Infrastructure & Microservices (`c:\projects\project-eventix\`)
- **Root Multi-Project Build**: `settings.gradle.kts` and `build.gradle.kts` managing 9 submodules under Gradle 8.10.2 and Java 21 toolchain.
- **Infrastructure Orchestration (`docker-compose.yml`)**:
  - Apache Kafka 3.7 KRaft (`apache/kafka:3.7.0`): Dual listeners configured (`PLAINTEXT://localhost:9092` for host, `PLAINTEXT_DOCKER://kafka:29092` for containers).
  - Debezium Kafka Connect (`debezium/connect:2.6.1.Final`): Port mapped to `8088:8083` (preventing host collision with inventory-service), registered connector `order-outbox-connector` capturing PostgreSQL WAL via `pgoutput` plugin.
  - PostgreSQL 16 (`debezium/postgres:16-alpine`): Port mapped to `5433:5432` (preventing host collision with local Windows PostgreSQL service), initialized with 7 dedicated databases: `order_db`, `inventory_db`, `payment_db`, `catalog_db`, `audit_db`, `digest_db`, `keycloak_db`.
  - Redis 7.2 (`redis:7-alpine`): Port `6379`.
  - Keycloak 24 (`quay.io/keycloak/keycloak:24.0.5`): Port `8089:8080`, realm import `docker/keycloak/realm-export.json`.
  - Mailpit (`axllent/mailpit:latest`): Ports `1025` SMTP, `8025` Web UI.
  - Kafka UI (`provectuslabs/kafka-ui:latest`): Port `8090:8080`.
- **`common-dto`**:
  - Event records: `OrderCreatedEvent`, `InventoryReservedEvent`, `InventoryFailedEvent`, `PaymentCompletedEvent`, `PaymentFailedEvent`, `OrderStatusUpdateEvent`, `AuditEvent`, `AuditLevel`.
  - DTO records: `OrderItemDto`, `PaymentDetailsDto`.
  - Constants: `KafkaTopics` (`order-created-events`, `inventory-reserved-events`, `payment-completed-events`, etc.).
- **`api-gateway` (Port 8080)**:
  - Spring Cloud Gateway routes for all 7 downstream services, STOMP WebSockets (`/ws-eventix/**`), and Keycloak (`/realms/**`).
  - `CorrelationIdFilter`: Injects or passes `X-Correlation-Id`.
  - Redis Token Bucket `RequestRateLimiter` (`replenishRate: 50`, `burstCapacity: 100`).
- **`catalog-service` (Port 8081)**:
  - `CatalogController`: `GET /api/v1/products`, `GET /api/v1/products/{id}`, `GET /api/v1/categories`.
  - `RedisCacheConfig`: Spring Redis cache configured with Jackson `JavaTimeModule` and default polymorphic typing for `java.time.Instant` serialization.
  - `DataInitializer`: Auto-seeds catalog products (`prod-101` through `prod-104`).
- **`order-service` (Port 8082)**:
  - `OrderController`: `POST /api/v1/orders`, `GET /api/v1/orders/{orderId}`, `GET /api/v1/orders/customer/{customerId}`.
  - Transactional Outbox pattern: Atomic dual-write into `orders` and `outbox_events` tables inside single `@Transactional`.
  - Saga initiator: Emits `OrderCreatedEvent` to `order-created-events` topic.
  - `OrderSagaListener`: Listens on `payment-completed-events` (confirms order, status -> `CONFIRMED`), `payment-failed-events` (status -> `CANCELLED`), and `inventory-failed-events` (status -> `REJECTED`), publishing `order-status-updates`.
- **`inventory-service` (Port 8083)**:
  - `InventoryController`: `GET /api/v1/inventory`, `POST /api/v1/inventory/restock`.
  - `InventoryService`: Redisson `RLock` distributed locking on `lock:inventory:{productId}` with alphabetical lock ordering across multi-item requests to eliminate deadlocks.
  - `InventoryOrderListener`: Consumes `order-created-events` -> reserves stock -> emits `inventory-reserved-events` (or `inventory-failed-events` on insufficient stock).
  - Compensation handler: Consumes `payment-failed-events` to restore reserved quantities.
- **`payment-service` (Port 8084)**:
  - `PaymentEventListener`: Idempotent Kafka consumer on `inventory-reserved-events`, verifies idempotency tokens in `processed_payments` table, simulates payment capture, and emits `payment-completed-events` (or `payment-failed-events`).
- **`notification-service` (Port 8085)**:
  - `WebSocketConfig`: STOMP message broker on `/ws-eventix` broadcasting to `/topic/orders` and `/topic/orders/{orderId}`.
  - `NotificationKafkaListener`: Consumes `order-status-updates` and relays live events to STOMP topic subscribers.
- **`audit-logging-service` (Port 8086)**:
  - Kafka consumer on `system-audit-events`.
  - `DataMaskingUtil`: GDPR/PCI-DSS regex redaction for credit card numbers, email addresses, and phone numbers before DB insertion.
  - `AuditController`: `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/stats`.
- **`daily-digest-service` (Port 8087)**:
  - Scheduled batch processing (`@Scheduled(cron = "0 0 23 * * *")`) aggregating revenue, order counts, and system error rates.
  - `DailyDigestController`: `POST /api/v1/digest/trigger-now`, `GET /api/v1/digest/history`.
  - `DailyDigestService`: Generates HTML email report and dispatches via `JavaMailSender` to Mailpit (host `localhost:1025`).

#### 2. Frontend Application (`c:\projects\project-eventix\frontend-client\`)
- **Core Tooling & Styling**: Vite 5.4.21, React Router v6, TypeScript 5.5, Tailwind CSS 3.4.
- **Network Proxy & API Interceptors (`vite.config.ts`, `src/api/client.ts`)**: Proxies `/api` and `/ws-eventix` to `http://localhost:8080`, auto-injects `X-Correlation-Id` and `Authorization: Bearer <token>`.
- **Stores**: `useAuthStore`, `useCartStore`, `useWishlistStore` with `localStorage` persistence.
- **18 Fully Wired Pages**:
  1. `HomePage.tsx` (`/`): Hero showcase, architecture cards, trending catalog.
  2. `CatalogPage.tsx` (`/products`): Full-text search, categories, price range, wishlist toggles.
  3. `ProductDetailPage.tsx` (`/products/:id`): Stock badge, quantity modifier, instant checkout.
  4. `CartPage.tsx` (`/cart`): Quantity modification, subtotal/tax summary, checkout dispatch.
  5. `CheckoutPage.tsx` (`/checkout`): Multi-field shipping form, mock card payment, `Idempotency-Key` generation.
  6. `OrderStatusPage.tsx` (`/orders/:id/status`): Real-time `@stomp/stompjs` WebSocket consumer tracking 4-step Saga progression and automated compensations.
  7. `OrderConfirmationPage.tsx` (`/orders/:id/confirmation`): Printable tax invoice receipt.
  8. `WishlistPage.tsx` (`/wishlist`): Saved items grid with single and bulk "Move to Cart".
  9. `LoginPage.tsx` (`/login`): Instant Customer & Admin token generation, redirect preserve.
  10. `RegisterPage.tsx` (`/register`): Password validation rules and instant profile provision.
  11. `ForgotPasswordPage.tsx` (`/forgot-password`, `/reset-password`): Password reset simulation.
  12. `OrderHistoryPage.tsx` (`/account/orders`): Customer orders list with status indicators.
  13. `ProfilePage.tsx` (`/account/profile`): User security and profile preferences.
  14. `SystemHealthPage.tsx` (`/system-health`): Live dashboard monitoring all 8 microservices, ports, latencies, Kafka, Redis, and DBs.
  15. `SupportFaqPage.tsx` (`/support`, `/faq`): Technical FAQ accordion and support ticket form.
  16. `AuditPage.tsx` (`/audit`): Admin console for masked security audit logs.
  17. `DigestPage.tsx` (`/digest`): Daily digest history and manual trigger action.
  18. `NotFoundPage.tsx` (`*`): Branded 404 handler.

#### 3. Documentation & Git Repository
- **`README.md`**: Flagship markdown documentation embedded with 10 Mermaid architectural diagrams and sequence flows (rendered automatically on GitHub repo front page).
- **`ARCHITECTURE_DIAGRAMS_AND_FLOWS.md`**: Dedicated diagram and specification reference.
- **`PROJECT_SUMMARY.md`**: Complete architectural summary document.
- **Remote Git Repository**: [`https://github.com/NetanelNissim1/project-eventix.git`](https://github.com/NetanelNissim1/project-eventix.git) on branch `main` (commit `4934358`).
- **Live Cloud Deployments (Railway)**:
  - Frontend Application: [`https://frontend-client-production-9a03.up.railway.app/`](https://frontend-client-production-9a03.up.railway.app/)
  - Spring Cloud API Gateway: [`https://api-gateway-production-961a.up.railway.app/`](https://api-gateway-production-961a.up.railway.app/)
- **Phase 1 (Complete)**: Role-Based Access Control (RBAC), user segregation (`ROLE_CUSTOMER` vs `ROLE_ADMIN`), 403 Forbidden barrier, Admin Console routing.
- **Phase 2 (Complete)**: Commercial Admin Console with Store Catalog management (`POST` / `DELETE` products with Redis cache eviction), Warehouse restock tool (`POST /api/v1/inventory/restock`), and Global Order Surveillance (`GET /api/v1/orders`).
- **Phase 3 (Complete)**: Commercial Promotions & Coupon Engine (`order-service` validation & discount deduction), Scarcity Urgency Alerts & Sold-Out purchase safeguards (`ProductDetailPage`), Admin Promotions tab, and Order Confirmation receipt dispatch notices.

---

### Key Decisions & Hard Constraints

#### Architectural Choices Locked In
- **Host Port Assignments**:
  - `8080`: `api-gateway`
  - `8081`: `catalog-service`
  - `8082`: `order-service`
  - `8083`: `inventory-service`
  - `8084`: `payment-service`
  - `8085`: `notification-service`
  - `8086`: `audit-logging-service`
  - `8087`: `daily-digest-service`
  - `8088`: `eventix-kafka-connect` (mapped to container port 8083)
  - `8089`: `eventix-keycloak` (mapped to container port 8080)
  - `8090`: `eventix-kafka-ui` (mapped to container port 8080)
  - `5433`: `eventix-postgres` (mapped to container port 5432 to avoid host collision with local Windows PostgreSQL service)
  - `6379`: `eventix-redis`
  - `9092`: `eventix-kafka`
  - `1025` / `8025`: `eventix-mailpit` SMTP / Web UI
  - `5173`: `frontend-client` Vite dev server
- **Saga Pattern**: Pure Choreography Saga over Kafka topics (`order-created-events`, `inventory-reserved-events`, `payment-completed-events`, `order-status-updates`, `inventory-failed-events`, `payment-failed-events`). Zero centralized orchestrator bottleneck.
- **Transactional Outbox & CDC**: Outbox events persisted to `outbox_events` within the same DB transaction as `orders`; Debezium captures WAL records via `pgoutput`.
- **Concurrency Control**: Redisson `RLock` on `lock:inventory:{productId}` with sorted lock ordering and 5s wait / 10s lease time.
- **PII Redaction**: Pre-persistence regex masking in `audit-logging-service` via `DataMaskingUtil`. Zero plaintext card numbers or emails written to `audit_db`.

#### Strict 'Do Nots' & Constraints
- **Do NOT** execute `npm` directly in PowerShell; always execute `npm.cmd` due to Windows ExecutionPolicy restrictions.
- **Do NOT** map Docker PostgreSQL to host port 5432; host port 5432 is occupied by local Windows PostgreSQL service `postgresql-x64-18`. Docker PostgreSQL must remain on host port `5433`.
- **Do NOT** map Kafka Connect to host port 8083; host port 8083 is reserved for `inventory-service`. Kafka Connect must remain on host port `8088`.
- **Do NOT** write UTF-8 with BOM (`\ufeff`) when creating or modifying Java source files.
- **Do NOT** bypass the API Gateway (port 8080) for client-to-backend communication.
- **Do NOT** introduce monolithic shared databases or cross-service table joins; every microservice owns its independent database schema.

---

### Current Status (Where We Left Off)
- **Codebase Integrity**: All backend modules compile with exit code 0 (`.\gradlew.bat assemble` clean). The frontend client compiles with exit code 0 (`tsc && vite build` clean).
- **Verified End-to-End Flow**: Full Checkout Saga was executed and validated:
  1. `POST http://localhost:8080/api/v1/orders` -> Order created in `PENDING` status.
  2. Stock reserved via Redisson distributed lock (`prod-101` available quantity decremented from 50 to 48).
  3. Idempotent payment processed in `payment-service`.
  4. Order transitioned to `CONFIRMED` in `order-service`.
  5. Audit log captured with unified trace ID `e5a32260-b741-44ef-b010-bbe50e0cd412`.
  6. Daily digest triggered, compiling metrics and sending HTML email report to Mailpit.
- **Clean Shutdown**: All background services, Vite dev server, and Docker Compose infrastructure containers have been cleanly stopped (`docker compose down`). All ports (`5173`, `8080-8090`, `5433`, `6379`, `1025`, `8025`) are verified free and unallocated.
- **Git State**: Clean working tree on `main` branch synchronized with remote `https://github.com/NetanelNissim1/project-eventix.git`.

---

### Immediate Next Task
Execute a live UI checkout from the browser (`http://localhost:5173/checkout`) to visually verify the 4-step real-time Saga tracker (`OrderStatusPage.tsx`) over STOMP WebSockets, and check the resulting invoice receipt on `OrderConfirmationPage.tsx`.
