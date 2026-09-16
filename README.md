# Project Eventix

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7.0%20(KRaft)-black.svg)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7.2%20Alpine-red.svg)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

**Project Eventix** is an enterprise-grade, high-concurrency, event-driven e-commerce platform engineered with a **Java 21 / Spring Boot 3** multi-project backend and a modern **React 18 / TypeScript / Tailwind CSS** Single Page Application (SPA).

The system implements the **Choreography Saga Pattern**, **Transactional Outbox Pattern** with **Debezium Change Data Capture (CDC)**, **Redisson Distributed Locks** for race-condition-free stock reservations, **Redis Token Bucket Rate Limiting**, and **Spring STOMP WebSockets** for real-time checkout telemetry.

---

## Table of Contents
1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [End-to-End Choreography Saga Flow](#2-end-to-end-choreography-saga-flow)
3. [Saga Compensation & Failure Handling](#3-saga-compensation--failure-handling)
4. [Transactional Outbox & Debezium CDC Pipeline](#4-transactional-outbox--debezium-cdc-pipeline)
5. [Concurrency Defense: Redisson Distributed Locking](#5-concurrency-defense-redisson-distributed-locking)
6. [Edge Rate Limiting (Redis Token Bucket)](#6-edge-rate-limiting-redis-token-bucket)
7. [GDPR & PCI-DSS Data Sanitization Pipeline](#7-gdpr--pci-dss-data-sanitization-pipeline)
8. [Scheduled Daily Digest Flow](#8-scheduled-daily-digest-flow)
9. [Database-Per-Service Topology](#9-database-per-service-topology)
10. [Network & Port Allocation Map](#10-network--port-allocation-map)
11. [Microservices Catalog](#11-microservices-catalog)
12. [Frontend Application (18 Routes)](#12-frontend-application-18-routes)
13. [How to Run the Project](#13-how-to-run-the-project)

---

## 1. System Architecture Diagram

```mermaid
flowchart TB
    %% Client Tier
    subgraph Client_Tier ["Client Tier (Browser / SPA)"]
        SPA["React 18 Single Page Application\n• TypeScript + Tailwind CSS\n• Zustand State Stores\n• STOMP WebSocket Client"]
    end

    %% Edge / Gateway Layer
    subgraph Edge_Tier ["Edge & Reverse Proxy Tier (Port 8080)"]
        GW["Spring Cloud API Gateway\n• Correlation ID Filter (X-Correlation-Id)\n• Redis Token Bucket Rate Limiter\n• Route Definitions & CORS Management"]
    end

    %% In-Memory & Cache Layer
    subgraph Redis_Tier ["In-Memory Tier (Redis 7.2 - Port 6379)"]
        RL_Cache[("Token Bucket Rate Limit State")]
        Cat_Cache[("Catalog Product Cache")]
        Dist_Lock[("Redisson Distributed Locks\nlock:inventory:{productId}")]
    end

    %% Core Microservices Tier
    subgraph Services_Tier ["Core Microservices Tier (Java 21 / Spring Boot 3)"]
        CatalogSvc["Catalog Service (Port 8081)\n• REST API\n• Spring Cache (Redis)"]
        OrderSvc["Order Service (Port 8082)\n• Transactional Outbox Pattern\n• Saga Initiator & Handler"]
        InventorySvc["Inventory Service (Port 8083)\n• Redisson RLock Concurrency\n• Stock Reservation & Restock"]
        PaymentSvc["Payment Service (Port 8084)\n• Idempotency Verification\n• PSP Gateway Simulation"]
        NotifSvc["Notification Service (Port 8085)\n• STOMP WebSocket Broker\n• Topic: /topic/orders/{orderId}"]
        AuditSvc["Audit Logging Service (Port 8086)\n• GDPR / PCI-DSS Masking\n• Security Audit Log Search"]
        DigestSvc["Daily Digest Service (Port 8087)\n• Scheduled Batch Reporting\n• JavaMailSender HTML Dispatch"]
    end

    %% Storage Tier
    subgraph Storage_Tier ["Storage Tier (PostgreSQL 16 - Port 5433)"]
        DB_Cat[("catalog_db")]
        DB_Order[("order_db\n• orders\n• outbox_events")]
        DB_Inv[("inventory_db\n• inventory_items")]
        DB_Pay[("payment_db\n• processed_payments")]
        DB_Audit[("audit_db\n• audit_logs")]
        DB_Digest[("digest_db\n• daily_digest_records")]
        DB_Keycloak[("keycloak_db")]
    end

    %% Event Streaming & CDC Tier
    subgraph Streaming_Tier ["Event Streaming & CDC Tier"]
        Debezium["Debezium CDC Connect (Port 8088)\n• PostgreSQL WAL logical replication\n• Plugin: pgoutput"]
        Kafka["Apache Kafka 3.7 KRaft (Port 9092 / 29092)\n• Dual Listeners (Host + Docker)"]
    end

    %% External & Admin Infrastructure
    subgraph Infra_Tier ["Infrastructure & Admin Consoles"]
        Keycloak["Keycloak 24 IAM (Port 8089)\n• OAuth2 / OIDC Realm"]
        Mailpit["Mailpit (Port 8025 Web / 1025 SMTP)\n• Mock Email Inbox"]
        KafkaUI["Kafka UI (Port 8090)\n• Broker & Topic Inspector"]
    end

    %% Connections
    SPA -->|"HTTP / REST & STOMP WS"| GW
    GW -->|"Rate Limit Checks"| RL_Cache
    GW -->|"Proxy: /api/v1/products"| CatalogSvc
    GW -->|"Proxy: /api/v1/orders"| OrderSvc
    GW -->|"Proxy: /api/v1/inventory"| InventorySvc
    GW -->|"Proxy: /api/v1/payments"| PaymentSvc
    GW -->|"Proxy: /ws-eventix"| NotifSvc
    GW -->|"Proxy: /api/v1/audit-logs"| AuditSvc
    GW -->|"Proxy: /api/v1/digest"| DigestSvc

    CatalogSvc -->|"Read / Write Cache"| Cat_Cache
    CatalogSvc --> DB_Cat

    OrderSvc -->|"Atomic Dual-Write"| DB_Order
    DB_Order -.->|"WAL Streaming"| Debezium
    Debezium -->|"Emit Outbox Events"| Kafka
    OrderSvc -->|"Publish Events"| Kafka

    InventorySvc -->|"Acquire / Release RLock"| Dist_Lock
    InventorySvc --> DB_Inv
    InventorySvc <-->|"Consume / Produce"| Kafka

    PaymentSvc --> DB_Pay
    PaymentSvc <-->|"Consume / Produce"| Kafka

    NotifSvc <-->|"Consume Updates"| Kafka
    NotifSvc -.->|"Push Live Status"| SPA

    AuditSvc --> DB_Audit
    AuditSvc <-->|"Consume System Audits"| Kafka

    DigestSvc --> DB_Digest
    DigestSvc -->|"Send SMTP"| Mailpit

    KafkaUI -->|"Inspect"| Kafka
    Keycloak --> DB_Keycloak
```

---

## 2. End-to-End Choreography Saga Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / SPA Client
    participant GW as API Gateway (8080)
    participant OrderSvc as Order Service (8082)
    participant DB as PostgreSQL (order_db)
    participant Kafka as Apache Kafka
    participant InvSvc as Inventory Service (8083)
    participant Redis as Redis (Redisson RLock)
    participant PaySvc as Payment Service (8084)
    participant NotifSvc as Notification Service (8085)
    participant AuditSvc as Audit Logging Service (8086)

    Customer->>GW: POST /api/v1/orders (Items, Idempotency Key)
    Note over GW: Rate Limit Check (Redis Token Bucket)<br/>Inject X-Correlation-Id
    GW->>OrderSvc: Forward POST /api/v1/orders

    rect rgb(240, 248, 255)
        Note over OrderSvc,DB: Transactional Outbox Boundary (@Transactional)
        OrderSvc->>DB: INSERT into orders (status = 'PENDING')
        OrderSvc->>DB: INSERT into outbox_events (event_type = 'OrderCreated')
    end

    OrderSvc->>Kafka: Publish OrderCreatedEvent -> [order-created-events]
    OrderSvc->>Kafka: Publish AuditEvent -> [system-audit-events]
    OrderSvc-->>Customer: HTTP 201 Created (status = PENDING, orderId)

    Customer->>NotifSvc: Connect STOMP WebSocket to /ws-eventix<br/>Subscribe: /topic/orders/{orderId}

    rect rgb(245, 255, 245)
        Note over InvSvc,Redis: Concurrency Defense (Redisson Distributed Lock)
        Kafka->>InvSvc: Consume OrderCreatedEvent
        InvSvc->>Redis: Acquire RLock("lock:inventory:{productId}")
        InvSvc->>InvSvc: Validate Stock >= Requested Quantity
        InvSvc->>InvSvc: Decrement availableQuantity, increment reservedQuantity
        InvSvc->>Redis: Release RLock
    end

    InvSvc->>Kafka: Publish InventoryReservedEvent -> [inventory-reserved-events]
    InvSvc->>Kafka: Publish AuditEvent -> [system-audit-events]

    rect rgb(255, 250, 240)
        Note over PaySvc: Idempotency & Payment
        Kafka->>PaySvc: Consume InventoryReservedEvent
        PaySvc->>PaySvc: Check processed_payments for duplicate key
        PaySvc->>PaySvc: Process Payment (Authorize & Capture)
        PaySvc->>PaySvc: Record payment transaction
    end

    PaySvc->>Kafka: Publish PaymentCompletedEvent -> [payment-completed-events]
    PaySvc->>Kafka: Publish AuditEvent -> [system-audit-events]

    rect rgb(240, 255, 240)
        Note over OrderSvc: Saga Confirmation
        Kafka->>OrderSvc: Consume PaymentCompletedEvent
        OrderSvc->>DB: UPDATE orders SET status = 'CONFIRMED'
        OrderSvc->>Kafka: Publish OrderStatusUpdateEvent -> [order-status-updates]
    end

    Kafka->>NotifSvc: Consume OrderStatusUpdateEvent
    NotifSvc-->>Customer: WebSocket STOMP Broadcast: status = 'CONFIRMED'
    Note over Customer: UI animates Step 4: Completed!<br/>Displays Order Receipt

    Kafka->>AuditSvc: Consume AuditEvent (all stages)
    Note over AuditSvc: Apply DataMaskingUtil (PII & Card Redaction)
    AuditSvc->>AuditSvc: Persist to audit_db
```

---

## 3. Saga Compensation & Failure Handling

### Scenario A: Insufficient Stock (Inventory Failure)

```mermaid
sequenceDiagram
    autonumber
    participant OrderSvc as Order Service
    participant Kafka as Apache Kafka
    participant InvSvc as Inventory Service
    participant NotifSvc as Notification Service
    actor Customer as User / SPA Client

    Kafka->>InvSvc: Consume OrderCreatedEvent
    Note over InvSvc: Stock Check: Available < Requested!
    InvSvc->>Kafka: Publish InventoryFailedEvent -> [inventory-failed-events]<br/>(reason: "Insufficient stock")

    Kafka->>OrderSvc: Consume InventoryFailedEvent
    OrderSvc->>OrderSvc: UPDATE orders SET status = 'REJECTED'
    OrderSvc->>Kafka: Publish OrderStatusUpdateEvent -> [order-status-updates]

    Kafka->>NotifSvc: Consume OrderStatusUpdateEvent
    NotifSvc-->>Customer: STOMP Alert: Order REJECTED (Out of stock)
    Note over Customer: UI displays stock alert modal
```

### Scenario B: Payment Declined (Compensating Transaction)

```mermaid
sequenceDiagram
    autonumber
    participant Kafka as Apache Kafka
    participant InvSvc as Inventory Service
    participant PaySvc as Payment Service
    participant OrderSvc as Order Service
    participant NotifSvc as Notification Service
    actor Customer as User / SPA Client

    Kafka->>PaySvc: Consume InventoryReservedEvent
    Note over PaySvc: PSP declines card (e.g. Insufficient Funds)
    PaySvc->>Kafka: Publish PaymentFailedEvent -> [payment-failed-events]<br/>(reason: "Card declined")

    par Compensate Inventory
        Kafka->>InvSvc: Consume PaymentFailedEvent
        Note over InvSvc: COMPENSATING ACTION:<br/>Restore availableQuantity (+N)<br/>Decrement reservedQuantity (-N)
    and Cancel Order
        Kafka->>OrderSvc: Consume PaymentFailedEvent
        OrderSvc->>OrderSvc: UPDATE orders SET status = 'CANCELLED'
        OrderSvc->>Kafka: Publish OrderStatusUpdateEvent -> [order-status-updates]
    end

    Kafka->>NotifSvc: Consume OrderStatusUpdateEvent
    NotifSvc-->>Customer: STOMP Alert: Order CANCELLED (Payment declined)
    Note over Customer: UI prompts user to update payment details
```

---

## 4. Transactional Outbox & Debezium CDC Pipeline

```mermaid
flowchart LR
    subgraph Client_App ["Order Service Application"]
        Code["OrderService.createOrder()"]
    end

    subgraph PostgreSQL ["PostgreSQL Database (order_db)"]
        subgraph Single_Tx ["Single Atomic Transaction"]
            OrdersTable[("orders Table\n(Order Entity)")]
            OutboxTable[("outbox_events Table\n(Event Payload JSON)")]
        end
        WAL["PostgreSQL Write-Ahead Log\n(pgoutput plugin)"]
    end

    subgraph CDC_Engine ["Debezium Kafka Connect Engine"]
        Connector["PostgresConnector\n(order-outbox-connector)"]
    end

    subgraph Message_Broker ["Apache Kafka"]
        CDCTopic["order-cdc.public.outbox_events"]
        DomainTopic["order-created-events"]
    end

    subgraph Downstream ["Event Consumers"]
        InvConsumer["Inventory Service"]
        AuditConsumer["Audit Logging Service"]
    end

    Code -->|"Atomic Dual-Write"| Single_Tx
    Single_Tx -.->|"Flushes to"| WAL
    WAL -->|"Low-Latency Streaming"| Connector
    Connector -->|"Capture Changes"| CDCTopic
    Code -->|"Direct Publish"| DomainTopic
    DomainTopic --> InvConsumer
    DomainTopic --> AuditConsumer
```

---

## 5. Concurrency Defense: Redisson Distributed Locking

```mermaid
sequenceDiagram
    autonumber
    participant Request1 as Order Request 1 (User A)
    participant Request2 as Order Request 2 (User B)
    participant InvSvc as Inventory Service
    participant Redis as Redis Distributed Lock Store
    participant DB as PostgreSQL (inventory_db)

    par User A and User B reserve simultaneously
        Request1->>InvSvc: reserveStock(prod-101, qty=2)
    and
        Request2->>InvSvc: reserveStock(prod-101, qty=3)
    end

    Note over InvSvc,Redis: Sort product IDs alphabetically to prevent deadlocks

    InvSvc->>Redis: Request 1: tryLock("lock:inventory:prod-101", wait=5s, lease=10s)
    Redis-->>InvSvc: Lock GRANTED to Request 1

    InvSvc->>Redis: Request 2: tryLock("lock:inventory:prod-101", wait=5s, lease=10s)
    Note over Redis: Lock BUSY: Request 2 waits on Redis pub/sub semaphore...

    rect rgb(240, 255, 240)
        Note over InvSvc,DB: Critical Section (Request 1)
        InvSvc->>DB: SELECT availableQuantity FROM inventory_items WHERE id = 'prod-101'
        Note over InvSvc: Current: 50 -> New: 48
        InvSvc->>DB: UPDATE inventory_items SET available_quantity = 48, version = version + 1
    end

    InvSvc->>Redis: Request 1: unlock("lock:inventory:prod-101")
    Redis-->>InvSvc: Lock RELEASED

    Redis-->>InvSvc: Lock GRANTED to Request 2

    rect rgb(240, 255, 240)
        Note over InvSvc,DB: Critical Section (Request 2)
        InvSvc->>DB: SELECT availableQuantity FROM inventory_items WHERE id = 'prod-101'
        Note over InvSvc: Current: 48 -> New: 45
        InvSvc->>DB: UPDATE inventory_items SET available_quantity = 45, version = version + 1
    end

    InvSvc->>Redis: Request 2: unlock("lock:inventory:prod-101")
    Note over InvSvc: Zero overselling. Guaranteed sequential consistency.
```

---

## 6. Edge Rate Limiting (Redis Token Bucket)

```mermaid
flowchart TD
    ClientReq["Incoming Client Request\n(IP / User Identity)"] --> Filter["Spring Cloud Gateway\nRequestRateLimiterFilter"]

    Filter --> TokenCheck{"Check Redis Token Bucket\n(Replenish Rate: 50/s\nBurst Capacity: 100)"}

    TokenCheck -->|"Tokens Available\n(Decrement Token)"| Allow["HTTP 200 / Forward Request\nto Downstream Service"]
    TokenCheck -->|"Bucket Empty\n(Rate Limit Exceeded)"| Reject["HTTP 429 Too Many Requests\n(Retry-After Header Returned)"]

    subgraph Redis_Storage ["Redis Key: request_rate_limiter.{ip}"]
        Tokens[("Available Tokens Count")]
        Timestamp[("Last Refill Timestamp")]
    end

    TokenCheck <--> Redis_Storage
```

---

## 7. GDPR & PCI-DSS Data Sanitization Pipeline

```mermaid
flowchart LR
    subgraph Raw_Events ["Raw Domain Events"]
        E1["OrderCreatedEvent\n{ customerEmail: 'user@test.com' }"]
        E2["PaymentDetails\n{ cardNumber: '4532-1234-5678-9012' }"]
        E3["ContactInfo\n{ phone: '+1-555-019-2834' }"]
    end

    subgraph Kafka_Bus ["Kafka: system-audit-events"]
        Bus[("Event Stream")]
    end

    subgraph Sanitizer ["Audit Logging Service: DataMaskingUtil"]
        Reg1["Credit Card Regex:\n\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?(\d{4}) -> ****-****-****-$1"]
        Reg2["Email Regex:\n([a-zA-Z0-9_.+-]{1,2})[^@]*(@.*) -> $1***$2"]
        Reg3["Phone Regex:\n(\+?\d{1,3}[- ]?)?\d{3,4}[- ]?(\d{4}) -> ***-***-$2"]
    end

    subgraph Storage ["Audit Database (audit_db)"]
        SanitizedDB[("audit_logs Table\n• Zero raw PII\n• Masked Audit Trail")]
    end

    subgraph Admin_UI ["Admin Web Console"]
        AuditPage["AuditPage.tsx (/audit)\n• Search by Trace ID\n• Regulatory Compliant Viewing"]
    end

    E1 --> Bus
    E2 --> Bus
    E3 --> Bus
    Bus --> Sanitizer
    Sanitizer --> SanitizedDB
    SanitizedDB --> AuditPage
```

---

## 8. Scheduled Daily Digest Flow

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Spring @Scheduled (0 0 23 * * *)
    participant DigestSvc as Daily Digest Service
    participant DB as PostgreSQL (digest_db)
    participant OrderDB as PostgreSQL (order_db)
    participant AuditDB as PostgreSQL (audit_db)
    participant Mailpit as Mailpit SMTP Server (Port 1025)
    actor Admin as Admin Email Inbox (Port 8025)

    Note over Cron,DigestSvc: Triggered at 23:00 daily (or via POST /api/v1/digest/trigger-now)
    DigestSvc->>OrderDB: Aggregate Total Orders & Total Revenue for Date
    DigestSvc->>AuditDB: Aggregate System Errors & Warning Counts
    DigestSvc->>DB: INSERT into daily_digest_records (status = 'GENERATING')

    DigestSvc->>DigestSvc: Compile HTML Email Template (Revenue, Metrics, Error summary)
    DigestSvc->>Mailpit: Dispatch HTML Email via JavaMailSender (admin@eventix.com)
    Mailpit-->>Admin: New Email in Inbox: "Eventix Daily Digest Report"

    DigestSvc->>DB: UPDATE daily_digest_records SET status = 'SENT'
    Note over Admin: Admin inspects daily health & financial stats in Mailpit UI
```

---

## 9. Database-Per-Service Topology

```mermaid
erDiagram
    CATALOG_DB ||--o{ PRODUCTS : contains
    CATALOG_DB ||--o{ CATEGORIES : contains
    ORDER_DB ||--o{ ORDERS : contains
    ORDER_DB ||--o{ ORDER_ITEMS : contains
    ORDER_DB ||--o{ OUTBOX_EVENTS : contains
    INVENTORY_DB ||--o{ INVENTORY_ITEMS : contains
    PAYMENT_DB ||--o{ PROCESSED_PAYMENTS : contains
    AUDIT_DB ||--o{ AUDIT_LOGS : contains
    DIGEST_DB ||--o{ DAILY_DIGEST_RECORDS : contains

    PRODUCTS {
        string id PK
        string name
        decimal price
        string category_id FK
    }
    ORDERS {
        string id PK
        string customer_id
        decimal total_amount
        string status
        timestamp created_at
    }
    OUTBOX_EVENTS {
        string id PK
        string aggregate_type
        string aggregate_id
        string event_type
        text payload
        string status
    }
    INVENTORY_ITEMS {
        string product_id PK
        int available_quantity
        int reserved_quantity
        int version
    }
    PROCESSED_PAYMENTS {
        string payment_id PK
        string order_id
        string idempotency_key
        decimal amount
        string status
    }
    AUDIT_LOGS {
        string id PK
        string trace_id
        string service_name
        string action
        text details_masked
    }
    DAILY_DIGEST_RECORDS {
        string id PK
        date report_date
        decimal total_revenue
        int total_orders
        string status
    }
```

---

## 10. Network & Port Allocation Map

```mermaid
flowchart LR
    subgraph Host_Clients ["Host Machine Clients"]
        Browser["Web Browser\nClient (Port 5173)"]
        Curl["CLI / API Clients"]
    end

    subgraph Edge_Port ["Edge Gateway"]
        P8080["Port 8080: Spring Cloud Gateway"]
    end

    subgraph Service_Ports ["Spring Boot Microservices"]
        P8081["Port 8081: catalog-service"]
        P8082["Port 8082: order-service"]
        P8083["Port 8083: inventory-service"]
        P8084["Port 8084: payment-service"]
        P8085["Port 8085: notification-service"]
        P8086["Port 8086: audit-logging-service"]
        P8087["Port 8087: daily-digest-service"]
    end

    subgraph Docker_Ports ["Docker Infrastructure Containers"]
        P6379["Port 6379: Redis 7.2 Alpine"]
        P5433["Port 5433: PostgreSQL 16 (7 DBs)"]
        P9092["Port 9092 / 29092: Apache Kafka 3.7 (KRaft)"]
        P8088["Port 8088: Debezium Kafka Connect"]
        P8089["Port 8089: Keycloak 24 IAM"]
        P8090["Port 8090: Kafka UI Console"]
        P8025["Port 8025 / 1025: Mailpit Web / SMTP"]
    end

    Browser --> P8080
    Curl --> P8080
    P8080 --> P8081
    P8080 --> P8082
    P8080 --> P8083
    P8080 --> P8084
    P8080 --> P8085
    P8080 --> P8086
    P8080 --> P8087
    P8080 --> P8089
```

---

## 11. Microservices Catalog

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

## 12. Frontend Application (18 Routes)

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

## 13. How to Run the Project

### 1. Start Infrastructure (Docker Compose)
```powershell
cd c:\projects\project-eventix
docker compose up -d

# Register the Debezium Outbox connector (after ~15s):
Invoke-RestMethod -Method Post -Uri "http://localhost:8088/connectors" -ContentType "application/json" -InFile "docker/debezium/register-postgres-outbox.json"
```

### 2. Launch Backend Microservices
```powershell
cd c:\projects\project-eventix

.\gradlew.bat :api-gateway:bootRun
.\gradlew.bat :catalog-service:bootRun
.\gradlew.bat :order-service:bootRun
.\gradlew.bat :inventory-service:bootRun
.\gradlew.bat :payment-service:bootRun
.\gradlew.bat :notification-service:bootRun
.\gradlew.bat :audit-logging-service:bootRun
.\gradlew.bat :daily-digest-service:bootRun
```

### 3. Launch Frontend Client
```powershell
cd c:\projects\project-eventix\frontend-client
npm.cmd run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Dashboard & Verification URLs

| Component | URL | Description |
| :--- | :--- | :--- |
| **Frontend Storefront** | `http://localhost:5173` | React 18 / Tailwind SPA |
| **System Health Console** | `http://localhost:5173/system-health` | Live telemetry for all 8 microservices & 6 infra nodes |
| **API Gateway** | `http://localhost:8080` | Edge reverse proxy & Redis rate limiter |
| **Kafka Web UI** | `http://localhost:8090` | Topic, partition, and consumer group inspector |
| **Mailpit Web UI** | `http://localhost:8025` | View generated order receipts and daily digest emails |
| **Keycloak IAM** | `http://localhost:8089` | Auth admin console (`admin` / `admin`) |
