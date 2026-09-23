package com.eventix.inventory;

import com.eventix.common.constants.KafkaTopics;
import com.eventix.common.dto.OrderItemDto;
import com.eventix.common.events.InventoryFailedEvent;
import com.eventix.common.events.InventoryReservedEvent;
import com.eventix.inventory.entity.InventoryItem;
import com.eventix.inventory.repository.InventoryRepository;
import com.eventix.inventory.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService Unit Tests - Stock Reservation & Concurrency")
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Mock
    private RLock lockProdA;

    @Mock
    private RLock lockProdB;

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(inventoryRepository, redissonClient, kafkaTemplate);
    }

    @Test
    @DisplayName("Should successfully reserve stock when sufficient inventory exists")
    void testReserveStockSuccessfulWhenQuantityAvailable() throws InterruptedException {
        // Arrange
        String orderId = "order-101";
        String traceId = "trace-xyz";
        OrderItemDto item1 = new OrderItemDto("prod-1", "Headphones", 2, new BigDecimal("100.00"));
        InventoryItem stock1 = new InventoryItem("prod-1", "Headphones", 10, 0);

        when(redissonClient.getLock("lock:inventory:prod-1")).thenReturn(lockProdA);
        when(lockProdA.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
        when(lockProdA.isHeldByCurrentThread()).thenReturn(true);
        when(inventoryRepository.findById("prod-1")).thenReturn(Optional.of(stock1));
        when(inventoryRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        boolean result = inventoryService.reserveStock(orderId, List.of(item1), traceId);

        // Assert
        assertThat(result).isTrue();
        assertThat(stock1.getAvailableQuantity()).isEqualTo(8);
        assertThat(stock1.getReservedQuantity()).isEqualTo(2);

        verify(kafkaTemplate).send(eq(KafkaTopics.INVENTORY_RESERVED), eq(orderId), any(InventoryReservedEvent.class));
        verify(lockProdA).unlock();
    }

    @Test
    @DisplayName("Should fail reservation and emit failure event when stock is insufficient")
    void testReserveStockFailsWhenInsufficientStock() throws InterruptedException {
        // Arrange
        String orderId = "order-102";
        String traceId = "trace-insufficient";
        OrderItemDto item = new OrderItemDto("prod-1", "Gaming Monitor", 5, new BigDecimal("499.00"));
        InventoryItem lowStock = new InventoryItem("prod-1", "Gaming Monitor", 2, 0);

        when(redissonClient.getLock("lock:inventory:prod-1")).thenReturn(lockProdA);
        when(lockProdA.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
        when(lockProdA.isHeldByCurrentThread()).thenReturn(true);
        when(inventoryRepository.findById("prod-1")).thenReturn(Optional.of(lowStock));

        // Act
        boolean result = inventoryService.reserveStock(orderId, List.of(item), traceId);

        // Assert
        assertThat(result).isFalse();
        assertThat(lowStock.getAvailableQuantity()).isEqualTo(2); // Unchanged

        ArgumentCaptor<InventoryFailedEvent> captor = ArgumentCaptor.forClass(InventoryFailedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.INVENTORY_FAILED), eq(orderId), captor.capture());
        assertThat(captor.getValue().reason()).contains("Insufficient stock");
        verify(lockProdA).unlock();
    }

    @Test
    @DisplayName("Should fail reservation when distributed lock cannot be acquired")
    void testReserveStockFailsWhenLockCannotBeAcquired() throws InterruptedException {
        // Arrange
        String orderId = "order-103";
        OrderItemDto item = new OrderItemDto("prod-busy", "Popular Item", 1, new BigDecimal("50.00"));

        when(redissonClient.getLock("lock:inventory:prod-busy")).thenReturn(lockProdA);
        when(lockProdA.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(false);

        // Act
        boolean result = inventoryService.reserveStock(orderId, List.of(item), "trace-lock-fail");

        // Assert
        assertThat(result).isFalse();
        verify(kafkaTemplate).send(eq(KafkaTopics.INVENTORY_FAILED), eq(orderId), any(InventoryFailedEvent.class));
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Saga Compensation: Should restore reserved quantities to available stock")
    void testReleaseReservationRestoresAvailableStock() {
        // Arrange
        String orderId = "order-compensate";
        OrderItemDto item = new OrderItemDto("prod-1", "Headphones", 3, new BigDecimal("100.00"));
        InventoryItem existingItem = new InventoryItem("prod-1", "Headphones", 5, 3);

        when(inventoryRepository.findById("prod-1")).thenReturn(Optional.of(existingItem));

        // Act
        inventoryService.releaseReservation(orderId, List.of(item), "Payment authorization failed");

        // Assert
        assertThat(existingItem.getAvailableQuantity()).isEqualTo(8);
        assertThat(existingItem.getReservedQuantity()).isEqualTo(0);
        verify(inventoryRepository).save(existingItem);
    }

    @Test
    @DisplayName("Should successfully add or update inventory item stock")
    void testAddOrUpdateStock() {
        // Arrange
        InventoryItem item = new InventoryItem("prod-new", "Mechanical Keyboard", 10, 0);
        when(inventoryRepository.findById("prod-new")).thenReturn(Optional.of(item));
        when(inventoryRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        InventoryItem updated = inventoryService.addOrUpdateStock("prod-new", "Mechanical Keyboard", 5);

        // Assert
        assertThat(updated.getAvailableQuantity()).isEqualTo(15);
        verify(inventoryRepository).save(item);
    }

    @Test
    @DisplayName("Should acquire locks in sorted order to guarantee deadlock freedom")
    void testLockAcquisitionInSortedOrder() throws InterruptedException {
        // Arrange
        OrderItemDto itemZ = new OrderItemDto("prod-z", "Item Z", 1, new BigDecimal("10.00"));
        OrderItemDto itemA = new OrderItemDto("prod-a", "Item A", 1, new BigDecimal("10.00"));

        when(redissonClient.getLock("lock:inventory:prod-a")).thenReturn(lockProdA);
        when(redissonClient.getLock("lock:inventory:prod-z")).thenReturn(lockProdB);
        when(lockProdA.tryLock(anyLong(), anyLong(), any())).thenReturn(true);
        when(lockProdB.tryLock(anyLong(), anyLong(), any())).thenReturn(true);
        when(inventoryRepository.findById("prod-a")).thenReturn(Optional.of(new InventoryItem("prod-a", "Item A", 5, 0)));
        when(inventoryRepository.findById("prod-z")).thenReturn(Optional.of(new InventoryItem("prod-z", "Item Z", 5, 0)));

        // Act - pass in reverse order (Z then A)
        boolean result = inventoryService.reserveStock("order-sort", List.of(itemZ, itemA), "trace-sort");

        // Assert
        assertThat(result).isTrue();
        // Verify lock on A was acquired before lock on Z
        var inOrder = inOrder(redissonClient);
        inOrder.verify(redissonClient).getLock("lock:inventory:prod-a");
        inOrder.verify(redissonClient).getLock("lock:inventory:prod-z");
    }
}
