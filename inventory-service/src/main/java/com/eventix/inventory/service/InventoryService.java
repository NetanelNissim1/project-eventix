package com.eventix.inventory.service;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.dto.OrderItemDto;
import com.eventix.common.events.AuditEvent;
import com.eventix.common.events.AuditLevel;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.InventoryReservedEvent;
import com.eventix.common.events.OrderStatusUpdateEvent;
import com.eventix.inventory.entity.InventoryItem;
import com.eventix.inventory.repository.InventoryRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final RedissonClient redissonClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public InventoryService(
        InventoryRepository inventoryRepository,
        RedissonClient redissonClient,
        KafkaTemplate<String, Object> kafkaTemplate
    ) {
        this.inventoryRepository = inventoryRepository;
        this.redissonClient = redissonClient;
        this.kafkaTemplate = kafkaTemplate;
    }

    public boolean reserveStock(String orderId, List<OrderItemDto> items, String traceId) {
        log.info("Attempting to reserve stock for order {} (items: {})", orderId, items.size());
        List<RLock> acquiredLocks = new ArrayList<>();

        try {
            // 1. Acquire distributed locks in sorted order to prevent deadlocks
            List<OrderItemDto> sortedItems = items.stream()
                .sorted((a, b) -> a.productId().compareTo(b.productId()))
                .toList();

            for (OrderItemDto item : sortedItems) {
                RLock lock = redissonClient.getLock("lock:inventory:" + item.productId());
                boolean acquired = lock.tryLock(5, 10, TimeUnit.SECONDS);
                if (!acquired) {
                    log.error("Failed to acquire distributed lock for product: {}", item.productId());
                    emitInventoryFailed(orderId, "Could not acquire lock for product " + item.productId(), traceId);
                    return false;
                }
                acquiredLocks.add(lock);
            }

            // 2. Check stock availability for all items
            for (OrderItemDto item : sortedItems) {
                InventoryItem inventory = inventoryRepository.findById(item.productId()).orElse(null);
                if (inventory == null || inventory.getAvailableQuantity() < item.quantity()) {
                    int available = (inventory == null) ? 0 : inventory.getAvailableQuantity();
                    log.warn("Insufficient stock for product {}. Requested: {}, Available: {}",
                        item.productId(), item.quantity(), available);
                    emitInventoryFailed(orderId, "Insufficient stock for product " + item.productName() + " (requested: " + item.quantity() + ", available: " + available + ")", traceId);
                    return false;
                }
            }

            // 3. Deduct stock atomically
            for (OrderItemDto item : sortedItems) {
                InventoryItem inventory = inventoryRepository.findById(item.productId()).get();
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() - item.quantity());
                inventory.setReservedQuantity(inventory.getReservedQuantity() + item.quantity());
                inventoryRepository.save(inventory);
            }

            log.info("Successfully reserved stock for order {}", orderId);

            // 4. Emit success events
            InventoryReservedEvent successEvent = new InventoryReservedEvent(
                orderId,
                items,
                Instant.now(),
                traceId
            );
            kafkaTemplate.send(KafkaTopics.INVENTORY_RESERVED, orderId, successEvent);

            OrderStatusUpdateEvent updateEvent = new OrderStatusUpdateEvent(
                orderId,
                "INVENTORY_RESERVED",
                "Inventory items successfully reserved.",
                Instant.now()
            );
            kafkaTemplate.send(KafkaTopics.ORDER_STATUS_UPDATES, orderId, updateEvent);

            publishAudit(traceId, AuditLevel.INFO, "RESERVE_STOCK_SUCCESS", "Reserved stock for order " + orderId, null);
            return true;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Thread interrupted while locking inventory for order {}", orderId, e);
            emitInventoryFailed(orderId, "Interrupted during stock reservation", traceId);
            return false;
        } finally {
            // Always release acquired locks
            for (RLock lock : acquiredLocks) {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        }
    }

    @Transactional
    public void releaseReservation(String orderId, List<OrderItemDto> items, String reason) {
        log.info("Saga Compensation: Releasing reserved stock for order {}. Reason: {}", orderId, reason);
        for (OrderItemDto item : items) {
            inventoryRepository.findById(item.productId()).ifPresent(inventory -> {
                int qty = item.quantity();
                inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - qty));
                inventory.setAvailableQuantity(inventory.getAvailableQuantity() + qty);
                inventoryRepository.save(inventory);
                log.info("Restored {} units of product {} to available stock", qty, item.productId());
            });
        }
        publishAudit(UUID.randomUUID().toString(), AuditLevel.WARNING, "COMPENSATE_STOCK_RELEASE", "Released reserved stock for order " + orderId + " due to: " + reason, null);
    }

    @Transactional
    public InventoryItem addOrUpdateStock(String productId, String productName, int quantity) {
        InventoryItem item = inventoryRepository.findById(productId)
            .orElseGet(() -> new InventoryItem(productId, productName, 0, 0));
        item.setProductName(productName);
        item.setAvailableQuantity(item.getAvailableQuantity() + quantity);
        return inventoryRepository.save(item);
    }

    @Transactional(readOnly = true)
    public List<InventoryItem> getAllStock() {
        return inventoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<InventoryItem> getStockByProductId(String productId) {
        return inventoryRepository.findById(productId);
    }

    private void emitInventoryFailed(String orderId, String reason, String traceId) {
        InventoryFailedEvent failedEvent = new InventoryFailedEvent(
            orderId,
            reason,
            Instant.now(),
            traceId
        );
        kafkaTemplate.send(KafkaTopics.INVENTORY_FAILED, orderId, failedEvent);

        publishAudit(traceId, AuditLevel.ERROR, "RESERVE_STOCK_FAILED", "Order " + orderId + " failed inventory: " + reason, reason);
    }

    private void publishAudit(String traceId, AuditLevel level, String action, String details, String error) {
        try {
            AuditEvent audit = new AuditEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                "inventory-service",
                traceId,
                "system",
                "internal",
                level,
                action,
                details,
                error
            );
            kafkaTemplate.send(KafkaTopics.SYSTEM_AUDIT_EVENTS, audit.id(), audit);
        } catch (Exception e) {
            log.warn("Failed to publish audit: {}", e.getMessage());
        }
    }
}
