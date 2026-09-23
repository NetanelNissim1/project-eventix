import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';
import { Product } from '../../types';

// Mock localStorage for Zustand persist middleware in Node environment
const mockStorage: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = String(value); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
  writable: true,
});

describe('useCartStore Unit Tests', () => {
  const sampleProduct1: Product = {
    id: 'prod-1',
    name: 'Logitech MX Master 3S',
    description: 'Wireless Performance Mouse',
    price: 99.99,
    category: 'Accessories',
    imageUrl: 'https://example.com/mouse.jpg',
  };

  const sampleProduct2: Product = {
    id: 'prod-2',
    name: 'Keychron Q1 Pro',
    description: 'Wireless Custom Mechanical Keyboard',
    price: 199.99,
    category: 'Keyboards',
    imageUrl: 'https://example.com/keyboard.jpg',
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('starts with an empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalCount()).toBe(0);
    expect(state.subtotal()).toBe(0);
  });

  it('adds a new item to the cart', () => {
    useCartStore.getState().addItem(sampleProduct1, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe('prod-1');
    expect(state.items[0].quantity).toBe(2);
    expect(state.totalCount()).toBe(2);
    expect(state.subtotal()).toBeCloseTo(199.98, 2);
  });

  it('increments quantity when adding an existing item', () => {
    useCartStore.getState().addItem(sampleProduct1, 1);
    useCartStore.getState().addItem(sampleProduct1, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.totalCount()).toBe(3);
    expect(state.subtotal()).toBeCloseTo(299.97, 2);
  });

  it('removes an item by product ID', () => {
    useCartStore.getState().addItem(sampleProduct1, 1);
    useCartStore.getState().addItem(sampleProduct2, 1);
    expect(useCartStore.getState().items).toHaveLength(2);

    useCartStore.getState().removeItem('prod-1');
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe('prod-2');
    expect(state.totalCount()).toBe(1);
  });

  it('updates item quantity properly', () => {
    useCartStore.getState().addItem(sampleProduct1, 1);
    useCartStore.getState().updateQuantity('prod-1', 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5);
    expect(state.totalCount()).toBe(5);
  });

  it('removes item if updated quantity is <= 0', () => {
    useCartStore.getState().addItem(sampleProduct1, 2);
    useCartStore.getState().updateQuantity('prod-1', 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalCount()).toBe(0);
  });

  it('calculates subtotal across multiple diverse items', () => {
    useCartStore.getState().addItem(sampleProduct1, 2); // 2 * 99.99 = 199.98
    useCartStore.getState().addItem(sampleProduct2, 3); // 3 * 199.99 = 599.97
    // Total = 799.95

    const state = useCartStore.getState();
    expect(state.totalCount()).toBe(5);
    expect(state.subtotal()).toBeCloseTo(799.95, 2);
  });

  it('clears all items in the cart', () => {
    useCartStore.getState().addItem(sampleProduct1, 2);
    useCartStore.getState().addItem(sampleProduct2, 1);
    expect(useCartStore.getState().items).toHaveLength(2);

    useCartStore.getState().clearCart();
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalCount()).toBe(0);
    expect(state.subtotal()).toBe(0);
  });
});
