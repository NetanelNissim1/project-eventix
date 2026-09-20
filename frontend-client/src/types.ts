export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: Category;
  stockQuantity?: number;
  sku?: string;
  rating?: number;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  phone: string;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customerId: string;
  customerEmail: string;
  items: OrderItemDto[];
  shippingAddress?: ShippingAddress;
  idempotencyKey?: string;
}

export interface OrderResponse {
  id: string;
  customerId: string;
  customerEmail: string;
  totalAmount: number;
  status: 'PENDING' | 'INVENTORY_RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  shippingAddress?: ShippingAddress;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  message: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  roles: string[];
  token?: string;
  phone?: string;
  addresses?: ShippingAddress[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  serviceName: string;
  traceId?: string;
  userId?: string;
  clientIp?: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY_ALERT';
  action: string;
  details?: string;
  errorDetails?: string;
}

export interface DailyDigest {
  id: string;
  reportDate: string;
  totalOrders: number;
  confirmedOrders: number;
  failedOrders: number;
  totalRevenue: number;
  totalErrors: number;
  totalWarnings: number;
  emailRecipient: string;
  status: string;
  generatedAt: string;
}

export interface DigestScheduleConfig {
  scheduleType: 'RECURRING' | 'ONE_OFF' | 'DISABLED';
  recurringFrequency: 'DAILY' | 'WEEKLY';
  targetHour: number;
  targetMinute: number;
  targetDayOfWeek: string;
  oneOffDateTime?: string;
  recipient: string;
  active: boolean;
  lastRun?: string;
  nextRunDescription?: string;
}

