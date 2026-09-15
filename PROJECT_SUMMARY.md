# Project Eventix - Comprehensive Project Summary

## 1. Executive Overview
**Project Eventix** is an enterprise-grade, high-concurrency, event-driven e-commerce platform engineered with a **Java 21 / Spring Boot 3** multi-module backend and a modern **React 18 / TypeScript / Tailwind CSS** Single Page Application (SPA).

The platform addresses core distributed systems challenges including eventual consistency, high concurrency contention, zero-data-loss event streaming, idempotency defense, real-time client notifications, and compliance with data privacy regulations (GDPR/PCI-DSS).

---

## 2. Architecture & Design Patterns

```
                                      +---------------------------------------------+
                                      |             React 18 + TS Client            |
                                      | (Vite, Tailwind, Zustand, STOMP WebSockets) |
                                      +----------------------+----------------------+
                                                             |
                                         REST / JSON & WS    | Port 8080
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
|                                            Spring Cloud API Gateway                                               |
|                    - Correlation ID Filter (`X-Correlation-Id`)                                                    |
|                    - Redis Token Bucket Rate Limiter (50 req/s, 100 burst)                                        |
|                    - Reverse Proxy routing to downstream microservices & WebSockets                                |
+--------+-----------------+-----------------+-----------------+-----------------+-----------------+----------------+
         |                 |                 |                 |                 |                 |
         v                 v                 v                 v                 v                 v
+-----------------+ +---------------+ +---------------+ +---------------+ +---------------+ +--------------------+
| Catalog Service | | Order Service | |Inventory Serv.| | Payment Serv. | | Notif. Service| | Audit Log Service  |
|  (Port 8081)    | |  (Port 8082)  | |  (Port 8083)  | |  (Port 8084)  | |  (Port 8085)  | |   (Port 8086)      |
| Redis Cache     | | Outbox Pattern| | Redisson Lock | | Idempotent    | | STOMP Broker  | | Regex PII Redact |
| DB: catalog_db  | | DB: order_db  | | DB: invent_db | | DB: paymt_db  | | WS: /ws-eventix| DB: audit_db       |
+-----------------+ +-------+-------+ +-------+-------+ +-------+-------+ +-------+-------+ +--------------------+
                            |                 ^                 ^                 ^
                            | WAL Logical     |                 |                 |
                            v Replication     |                 |                 |
                     +--------------+         |                 |                 |
                     |   Debezium   |         |                 |                 |
                     |  CDC Connect |         |                 |                 |
                     | (Port 8088)  |         |                 |                 |
                     +------+-------+         |                 |                 |
                            |                 |                 |                 |
                            v                 |                 |                 |
+---------------------------------------------+-----------------+-----------------+---------------------------------+
|                                           Apache Kafka 3.7 (KRaft)                                                |
|  Topics: order-created, inventory-reserved, payment-completed, order-completed, order-failed, audit-events        |
+-------------------------------------------------------------------------------------------------------------------+
```

### Key Architectural Patterns
1. **Choreography Saga Pattern**: Distributed transactions span microservices without a single point of failure or centralized orchestrator. Services emit domain events onto Kafka and react asynchronously to progress the transaction or trigger compensating actions upon failure.
2. **Transactional Outbox Pattern**: In `order-service`, business state changes and domain events are committed atomically to PostgreSQL inside a single `@Transactional` boundary (`orders` and `outbox_events` tables).
3. **Change Data Capture (CDC)**: Debezium PostgreSQL Connector streams changes from the PostgreSQL Write-Ahead Log (`pgoutput`) directly into Apache Kafka, achieving zero-data-loss event publication with sub-second latency.
4. **Distributed Concurrency Locking**: `inventory-service` leverages **Redisson Distributed Locks (`RLock`)** with sorted lock acquisition by product ID (`lock:inventory:{productId}`) to guarantee race-condition-free reservations under heavy concurrency.
5. **Idempotent Consumers**: `payment-service` and saga listeners verify idempotency tokens against database records (`processed_payments`), preventing duplicate credit charges from network retransmissions or Kafka consumer rebalances.
6. **Token Bucket Rate Limiting**: The Spring Cloud API Gateway integrates with Redis to enforce edge rate limiting (50 replenish rate / 100 burst capacity), shielding backend services from traffic spikes and DDoS attacks.
7. **Real-Time Client Telemetry**: `notification-service` hosts an in-memory STOMP message broker broadcasting live Saga state transitions (`/topic/orders/{orderId}`) directly to active checkout sessions.
8. **Compliance & Data Protection**: `audit-logging-service` consumes all audit events and strips sensitive PII (credit cards, emails, phone numbers) using regex masking before persisting to relational storage.

---

## 3. Microservices Catalog

| Service | Port | Database | Primary Technologies & Responsibilities |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | `8080` | Redis 7 | Spring Cloud Gateway, Redis Token Bucket Rate Limiter, Global `X-Correlation-Id` tracing, CORS management. |
| **`catalog-service`** | `8081` | `catalog_db` | Spring Boot 3, Spring Data JPA, Spring Cache (Redis), product search, categories, automated seeding. |
| **`order-service`** | `8082` | `order_db` | Spring Boot 3, Transactional Outbox dual-write, Saga initiator, compensation listener (`order-failed`). |
| **`inventory-service`** | `8083` | `inventory_db` | Spring Boot 3, Redisson distributed locking, multi-item dead-lock prevention, stock reservation & restock. |
| **`payment-service`** | `8084` | `payment_db` | Spring Boot 3, Idempotency tracking engine, mock payment gateway verification, payment completion events. |
| **`notification-service`** | `8085` | N/A | Spring WebSocket, STOMP broker (`/ws-eventix`), multi-destination topic broadcasting. |
| **`audit-logging-service`**| `8086` | `audit_db` | Spring Kafka, `DataMaskingUtil` GDPR/PCI-DSS sanitization engine, queryable security audit API. |
| **`daily-digest-service`** | `8087` | `digest_db` | Scheduled batch aggregator (`0 0 23 * * *`), `JavaMailSender`, HTML email dispatch to Mailpit. |
| **`common-dto`** | Library | N/A | Shared event records (`OrderCreatedEvent`, `InventoryReservedEvent`, etc.), DTOs, and Kafka topic constants. |

---

## 4. Choreography Saga Lifecycle

```
Client Submits Order
        │
        ▼
[order-service] ───────────────> Commits to `orders` & `outbox_events` (Atomic DB Transaction)
        │
        ▼ (Debezium CDC via WAL)
   Kafka Topic: `order-created`
        │
        ▼
[inventory-service] ───────────> Acquires Redisson RLock per item
        │                        Checks stock; decrements inventory
        ├─ Success ────────────> Kafka Topic: `inventory-reserved`
        └─ Insufficient Stock ─> Kafka Topic: `inventory-failed` ──> [order-service] Marks Order CANCELLED
                                                                 ──> [notification-service] WS Alert
        │ (On Success)
        ▼
[payment-service] ─────────────> Checks Idempotency Key
        │                        Simulates PSP transaction
        ├─ Success ────────────> Kafka Topic: `payment-completed`
        └─ Declined ───────────> Kafka Topic: `payment-failed` ────> [inventory-service] Compensates (Restores stock)
                                                                 ──> [order-service] Marks Order CANCELLED
        │ (On Success)
        ▼
[order-service] ───────────────> Updates Order status to COMPLETED
[notification-service] ────────> Broadcasts COMPLETED over STOMP to `/topic/orders/{orderId}`
[audit-logging-service] ───────> Sanitizes & persists transaction audit trail
```

---

## 5. Frontend Single Page Application (`frontend-client`)

Built with **React 18**, **TypeScript 5.5**, **Vite 5.4**, and **Tailwind CSS 3.4**.

### Complete Page Catalog (18 Routes)
1. **`HomePage` (`/`)**: Hero banner, architecture feature highlights, and trending products.
2. **`CatalogPage` (`/products`)**: Product browsing, category filtering, search query, stock status tags, and wishlist integration.
3. **`ProductDetailPage` (`/products/:id`)**: High-res imagery, specifications, quantity selector, add to cart, and instant checkout.
4. **`CartPage` (`/cart`)**: Reactive cart management, tax calculation, promo code entry, and checkout flow trigger.
5. **`CheckoutPage` (`/checkout`)**: Shipping details, mock credit card input, and idempotency key generation.
6. **`OrderStatusPage` (`/orders/:id/status`)**: Live `@stomp/stompjs` WebSocket consumer animating the 4-step Saga progression with automated compensation handling.
7. **`OrderConfirmationPage` (`/orders/:id/confirmation`)**: Formatted invoice receipt with printable layout.
8. **`WishlistPage` (`/wishlist`)**: Saved items grid with single/bulk "Move to Cart" action.
9. **`LoginPage` (`/login`)**: Instant Customer & Admin token generation, redirect-preserving navigation.
10. **`RegisterPage` (`/register`)**: Validation-guarded user registration form.
11. **`ForgotPasswordPage` (`/forgot-password`, `/reset-password`)**: Multi-step password reset workflow.
12. **`OrderHistoryPage` (`/account/orders`)**: Historical orders view with status badges and re-order triggers.
13. **`ProfilePage` (`/account/profile`)**: Account security and personal preference settings.
14. **`SystemHealthPage` (`/system-health`)**: Live telemetry dashboard tracking all 8 services and 6 infrastructure nodes.
15. **`SupportFaqPage` (`/support`, `/faq`)**: Technical architecture FAQ accordion and ticket submission.
16. **`AuditPage` (`/audit`)**: Admin console displaying GDPR/PCI-DSS masked audit logs.
17. **`DigestPage` (`/digest`)**: Financial summary dashboard and manual batch trigger.
18. **`NotFoundPage` (`*`)**: 404 handler with fallback navigation.

---

## 6. Infrastructure & Deployment Topology

Orchestrated via [`docker-compose.yml`](file:///c:/projects/project-eventix/docker-compose.yml):
- **Apache Kafka 3.7 (KRaft)**: `localhost:9092`
- **Kafka UI**: `localhost:8090`
- **Debezium Connect**: `localhost:8088` (REST API for connectors)
- **PostgreSQL 16**: `localhost:5432` (`postgres` / `postgres`)
- **Redis 7.2 Alpine**: `localhost:6379`
- **Keycloak 24 IAM**: `localhost:8089` (pre-configured realm export)
- **Mailpit SMTP & Web**: `localhost:1025` (SMTP) / `localhost:8025` (Web UI)

---

## 7. How to Run the Project

### 1. Start Infrastructure
```powershell
docker compose up -d
# Wait 15 seconds, then register outbox connector:
Invoke-RestMethod -Method Post -Uri "http://localhost:8088/connectors" -ContentType "application/json" -InFile "docker/debezium/register-postgres-outbox.json"
```

### 2. Start Backend Microservices
```powershell
.\gradlew.bat :api-gateway:bootRun
.\gradlew.bat :catalog-service:bootRun
.\gradlew.bat :order-service:bootRun
.\gradlew.bat :inventory-service:bootRun
.\gradlew.bat :payment-service:bootRun
.\gradlew.bat :notification-service:bootRun
.\gradlew.bat :audit-logging-service:bootRun
.\gradlew.bat :daily-digest-service:bootRun
```

### 3. Start Frontend Client
```powershell
cd frontend-client
npm.cmd run dev
```
Navigate to **`http://localhost:5173`**.
