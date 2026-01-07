import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Order,
  OrderItem,
  OrderInput,
  OrderWithItems,
  OrderSummary,
  OrderStatus,
} from '@/types';
import { getCustomerById } from './customers';
import { getProductById } from './products';

const ORDERS_COLLECTION = 'orders';
const ORDER_ITEMS_COLLECTION = 'order_items';

// Generate order ID with date prefix
function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD${dateStr}-${random}`;
}

// Generate item ID
function generateItemId(orderId: string, index: number): string {
  return `ITEM${orderId.slice(3)}-${String(index + 1).padStart(2, '0')}`;
}

// Get orders by date
export async function getOrdersByDate(date: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('deliveryDate', '==', date),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Order);
}

// Get orders by status
export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('status', '==', status),
    orderBy('deliveryDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Order);
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Order;
  }
  return null;
}

// Get order items by order ID
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const q = query(
    collection(db, ORDER_ITEMS_COLLECTION),
    where('orderId', '==', orderId),
    orderBy('priority', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as OrderItem);
}

// Get order with items
export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const items = await getOrderItems(orderId);
  return { ...order, items };
}

// Get today's orders summary
export async function getTodayOrdersSummary(): Promise<OrderSummary[]> {
  const today = new Date().toISOString().slice(0, 10);
  const orders = await getOrdersByDate(today);

  return orders.map((order) => ({
    orderId: order.orderId,
    customerCode: order.customerCode,
    customerName: order.customerName,
    deliveryDate: order.deliveryDate,
    zone: order.zone,
    timeConstraint: order.timeConstraint,
    itemCount: order.itemCount,
    totalWeight: order.totalWeight,
    status: order.status,
    source: order.source,
  }));
}

// Create new order with items
export async function createOrder(input: OrderInput): Promise<Order> {
  const orderId = generateOrderId();
  const now = Timestamp.now();

  // Get customer data
  const customer = await getCustomerById(input.customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Calculate total weight and get product names
  let totalWeight = 0;
  const itemsWithDetails: Array<{
    productId: string;
    productName: string;
    category: string;
    orderedQty: number;
    unit: string;
  }> = [];

  for (const item of input.items) {
    const product = await getProductById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    totalWeight += item.orderedQty;
    itemsWithDetails.push({
      productId: product.productId,
      productName: product.name.ko,
      category: product.category,
      orderedQty: item.orderedQty,
      unit: product.unit,
    });
  }

  // Create order
  const order: Order = {
    orderId,
    customerId: customer.customerId,
    customerCode: customer.code,
    customerName: customer.name,
    deliveryDate: input.deliveryDate,
    zone: customer.zone,
    timeConstraint: customer.timeConstraint,
    itemCount: input.items.length,
    totalWeight,
    status: 'ordered',
    source: input.source,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };

  // Create order items
  const orderItems: OrderItem[] = itemsWithDetails.map((item, index) => ({
    itemId: generateItemId(orderId, index),
    orderId,
    customerId: customer.customerId,
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    orderedQty: item.orderedQty,
    unit: item.unit,
    status: 'pending',
    priority: index + 1,
    createdAt: now,
    updatedAt: now,
  }));

  // Batch write
  const batch = writeBatch(db);

  batch.set(doc(db, ORDERS_COLLECTION, orderId), order);

  for (const item of orderItems) {
    batch.set(doc(db, ORDER_ITEMS_COLLECTION, item.itemId), item);
  }

  await batch.commit();

  return order;
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

// Update order
export async function updateOrder(
  orderId: string,
  updates: Partial<Pick<Order, 'deliveryDate' | 'note' | 'vehicleId'>>
): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Get recent orders (last 7 days)
export async function getRecentOrders(limit: number = 50): Promise<Order[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().slice(0, 10);

  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('deliveryDate', '>=', startDate),
    orderBy('deliveryDate', 'desc'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map((doc) => doc.data() as Order);
}
