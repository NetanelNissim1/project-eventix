הנה סיכום טכני מקיף (System Prompt / Context Spec) ותרשים זרימה מפורט ומובנה (באמצעות תחביר Mermaid וטקסטואלי), המוכנים להזנה ישירה למודל AI לפיתוח ומימוש המערכת.

## 1. מסמך אפיון וסיכום טכני (System Prompt & Architecture Spec)

### Role & Objective
You are a Principal Software Architect and Senior Spring/Java Engineer. Your task is to design and implement an end-to-end, high-concurrency, event-driven E-Commerce platform using modern Spring Boot 3+ (Java 21), Spring Cloud, Kafka, Redis, and a modern Single-Page Application (SPA) client.

### Core Architectural Principles
1. **Event-Driven Architecture (EDA):** Asynchronous communication via Apache Kafka for decoupling, load leveling (shock absorbing), and high throughput.
2. **Zero Data Loss:** Guaranteed delivery using the Transactional Outbox Pattern with Debezium (CDC) or scheduled Spring polling, Idempotent Consumers, and Dead Letter Topics (DLT).
3. **Polyglot Persistence & Database-per-Service:** Dedicated data stores per domain; no cross-service direct DB access.
4. **Concurrency & High Performance:**
   - Java 21 Virtual Threads (Loom) or Spring WebFlux for high I/O concurrency.
   - Distributed Locks via Redis (Redisson) for stock reservations to prevent overselling.
   - Multi-Tier Caching via Redis (Spring Cache abstraction).
   - Rate Limiting via Spring Cloud Gateway + Redis Token Bucket.
5. **Distributed Consistency:** Choreographed or Orchestrated Saga Pattern with compensating transactions.

### Tech Stack Details
- **Client Tier:** Modern SPA (React / Next.js or Vue 3) communicating via REST/JSON, WebSockets (for real-time order tracking), and JWT Bearer Tokens.
- **Gateway & Security:**
  - Spring Cloud Gateway (Routing, SSL, Redis-backed Rate Limiting, CORS).
  - Spring Security 6 with OAuth2 Resource Server (stateless JWT validation).
- **Inter-Service Messaging:**
  - Apache Kafka managed via Spring Cloud Stream (functional programming model: `java.util.function.Function` / `Consumer` / `Supplier`).
- **Caching & Locking:**
  - Redis 7+ via Spring Data Redis & Redisson (distributed locking, caching, session tracking).
- **Core Microservices (Spring Boot 3 + Java 21):**
  1. API Gateway Service: Entry point, auth verification, routing.
  2. Product Catalog Service: MongoDB / PostgreSQL, Spring Cache (Redis) for high read throughput.
  3. Order Service: PostgreSQL, JPA/Hibernate, Transactional Outbox, initiates Saga.
  4. Inventory Service: PostgreSQL, Redis Distributed Lock (`RLock`) for race-condition-free reservations.
  5. Payment Service: PostgreSQL, external PSP integration mock, emits PaymentProcessed / PaymentFailed.
  6. Notification/Status Service: WebSocket server (Spring WebSocket + STOMP) to push order updates back to the Client.
- **Observability:**
  - Micrometer, Prometheus, Grafana, OpenTelemetry / Zipkin distributed tracing.

## 2. תרשים זרימת ארכיטקטורה מפורט (System Architecture Diagram)
ניתן להעתיק את קוד ה-Mermaid הבא ישירות לכל כלי תומך (כגון Mermaid Live Editor, GitHub, או כהנחיה למודל שפה):

```mermaid
flowchart TB
    %% Client & CDN
    subgraph Client_Layer ["Client Tier"]
        SPA["Frontend Client (React/Next.js)\n• User Checkout UI\n• STOMP WebSocket Listener"]
    end

    %% Edge & Gateway
    subgraph Edge_Layer ["Security & Routing"]
        GW["Spring Cloud Gateway\n• JWT Filter (Spring Security)\n• Rate Limiter Filter (Redis)\n• Reverse Proxy Router"]
    end

    %% Redis Shared Tier
    subgraph In_Memory_Tier ["Redis Infrastructure"]
        RedisRL[("Redis: Rate Limits")]
        RedisCache[("Redis: Catalog Cache")]
        RedisLock[("Redis: Distributed Lock (Redisson)")]
    end

    %% Microservices
    subgraph Microservices_Core ["Core Microservices Tier (Spring Boot 3 + Java 21)"]
        CatalogSvc["Catalog Service\n• Spring Data JPA/Mongo\n• @Cacheable (Redis)"]
        OrderSvc["Order Service\n• Outbox Pattern\n• Saga Coordinator"]
        InvSvc["Inventory Service\n• Distributed Stock Lock\n• Compensating Actions"]
        PaymentSvc["Payment Service\n• Payment Gateway Gateway\n• Idempotent Consumer"]
        NotifSvc["Notification Service\n• WebSocket Gateway\n• Push Updates to Client"]
    end

    %% Databases
    subgraph Storage_Tier ["Database-per-Service (Isolated)"]
        CatalogDB[("Catalog DB\n(PostgreSQL / MongoDB)")]
        OrderDB[("Order DB (PostgreSQL)\n• Orders Table\n• Outbox Table")]
        InvDB[("Inventory DB\n(PostgreSQL)")]
        PayDB[("Payment DB\n(PostgreSQL)")]
    end

    %% Event Broker
    subgraph Kafka_Bus ["Event Broker (Apache Kafka - Spring Cloud Stream)"]
        T_OrderCreated["Topic: order-created-events"]
        T_InvReserved["Topic: inventory-reserved-events"]
        T_InvFailed["Topic: inventory-failed-events"]
        T_PayCompleted["Topic: payment-completed-events"]
        T_PayFailed["Topic: payment-failed-events"]
        T_OrderUpdates["Topic: order-status-updates"]
    end

    %% Flow Connections
    SPA -->|"1. HTTPS / REST (Place Order)"| GW
    GW -.->|"Check Rate Limit"| RedisRL
    GW -->|"Forward Request"| OrderSvc
    GW -->|"Forward Read Requests"| CatalogSvc
    CatalogSvc <-->|"Read/Write Cache"| RedisCache
    CatalogSvc <--> CatalogDB

    %% Order Service Flow (Outbox)
    OrderSvc -->|"2. Write Order & Outbox Record in 1 TX"| OrderDB
    OrderSvc -->|"3. CDC / Poller reads Outbox & Publishes"| T_OrderCreated

    %% Inventory Flow
    T_OrderCreated -->|"4. Consume Event"| InvSvc
    InvSvc -->|"5. Acquire Distributed Lock"| RedisLock
    InvSvc -->|"6. Reserve Stock (Optimistic/Pessimistic)"| InvDB
    InvSvc -->|"7a. Release Lock & Emit Success"| T_InvReserved
    InvSvc -->|"7b. Emit Stock Depleted (Compensate)"| T_InvFailed

    %% Payment Flow
    T_InvReserved -->|"8. Consume Event"| PaymentSvc
    PaymentSvc -->|"9. Process Transaction"| PayDB
    PaymentSvc -->|"10a. Emit Payment Success"| T_PayCompleted
    PaymentSvc -->|"10b. Emit Payment Failure"| T_PayFailed

    %% Saga Resolution & Notifications
    T_PayCompleted -->|"11a. Update Status to PAID"| OrderSvc
    T_PayFailed -->|"11b. Trigger Compensation (Cancel Order)"| OrderSvc
    T_PayFailed -->|"11c. Release Reserved Stock"| InvSvc
    T_InvFailed -->|"11d. Update Status to REJECTED"| OrderSvc

    %% Status to User
    T_OrderCreated --> T_OrderUpdates
    T_PayCompleted --> T_OrderUpdates
    T_PayFailed --> T_OrderUpdates
    T_OrderUpdates -->|"12. Stream Status"| NotifSvc
    NotifSvc ==>|"13. Push real-time status (WebSocket/STOMP)"| SPA

    ## 3. תרחיש מקצה-לקצה ללא איבוד מידע (Zero-Loss Checkout Flow)

### שלב 1: אימות וסינון (Gateway & Redis)
הלקוח (SPA) שולח בקשת `POST /api/v1/orders` עם JWT Header.
ה-Gateway מבצע ולידציה של ה-Token ומשתמש ב-Redis לצורך Rate Limiting (למניעת הצפת בוטים).

### שלב 2: יצירת הזמנה אמינה (Transactional Outbox)
ה-Order Service מקבל את הבקשה ופותח טרנזקציה רלציונית מקומית (`@Transactional`) ב-PostgreSQL.
הוא שומר שתי רשומות באותה טרנזקציה: רשומת `orders` (סטטוס PENDING) ורשומת `outbox_events` (המכילה את פרטי האירוע ב-JSON).
מנגנון Outbox (למשל ספריה ייעודית, polling background worker או Debezium CDC) שולף את הרשומה ומפרסם אותה ל-Kafka לטופיק `order-created-events` תוך אישור הגעה (Producer `ACKs=all`).

### שלב 3: נעילה מבוזרת ובדיקת מלאי (Redis + Inventory Service)
ה-Inventory Service מאזין לטופיק דרך Consumer Group ייעודי.
כדי למנוע Race Conditions כשמספר לקוחות מזמינים את אותו הפריט בו-זמנית, השירות מושך מפתח נעילה מבוזר דרך Redisson (`RLock lock = redisson.getLock("item:" + itemId)`).
המלאי מעודכן ב-DB, הנעילה משתחררת, ונשלח אירוע `inventory-reserved-events` (או אירוע כשל `inventory-failed-events`).

### שלב 4: תשלום ופיצויים (Saga Execution)
ה-Payment Service מעבד את התשלום באופן אידמפוטנטי (Idempotent Consumer, שומר `idempotency_key` ייחודי למניעת חיוב כפול).
במידה והתשלום נכשל, נשלח אירוע `payment-failed-events` שמפעיל טרנזקציית פיצוי (Compensating Transaction) המחזירה את המלאי ומבטלת את ההזמנה.

### שלב 5: עדכון חי של הלקוח
ה-Notification Service מאזין לכלל אירועי מחזור החיים של ההזמנה ודוחף עדכון מיידי ל-SPA דרך WebSockets / STOMP.