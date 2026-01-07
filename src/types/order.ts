import { BaseDocument, OrderStatus, ItemStatus, OrderSource } from './common';

// Order document
export interface Order extends BaseDocument {
  orderId: string;           // "ORD260107-001"
  customerId: string;        // Customer reference
  customerCode: string;      // "DB1" - denormalized for display
  customerName: string;      // "다본푸드" - denormalized for display
  deliveryDate: string;      // "2026-01-07" - ISO date string
  zone: string;              // "A7" - delivery zone
  timeConstraint?: string;   // "09:00" - delivery time constraint
  itemCount: number;         // Number of items
  totalWeight: number;       // Total ordered weight (kg)
  actualWeight?: number;     // Actual produced weight (kg)
  status: OrderStatus;       // Order status
  vehicleId?: string;        // Assigned vehicle
  source: OrderSource;       // Order source (line/phone/manual)
  note?: string;             // Order note
}

// Order item document
export interface OrderItem extends BaseDocument {
  itemId: string;            // "ITEM260107-001-01"
  orderId: string;           // Order reference
  customerId: string;        // Customer reference
  productId: string;         // Product reference
  productName: string;       // "삼겹 6피스컷" - denormalized
  category: string;          // "samgyeop" - for grouping
  orderedQty: number;        // Ordered quantity (kg)
  actualQty?: number;        // Actual produced quantity (kg)
  unit: string;              // "kg"
  status: ItemStatus;        // Item status
  priority: number;          // Priority for production order
}

// For creating new order (form input)
export interface OrderInput {
  customerId: string;
  deliveryDate: string;
  source: OrderSource;
  note?: string;
  items: OrderItemInput[];
}

// For creating new order item
export interface OrderItemInput {
  productId: string;
  orderedQty: number;
}

// Order with items (for display)
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Order summary for list view
export interface OrderSummary {
  orderId: string;
  customerCode: string;
  customerName: string;
  deliveryDate: string;
  zone: string;
  timeConstraint?: string;
  itemCount: number;
  totalWeight: number;
  status: OrderStatus;
  source: OrderSource;
}

// Daily orders grouped by status
export interface DailyOrdersSummary {
  date: string;
  total: number;
  byStatus: Record<OrderStatus, number>;
  totalWeight: number;
}
