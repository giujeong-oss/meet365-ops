'use client';

import { OrderCard } from './OrderCard';
import { OrderSummary } from '@/types';

interface OrderListProps {
  orders: OrderSummary[];
  locale?: string;
  emptyMessage?: string;
}

export function OrderList({ orders, locale = 'ko', emptyMessage = '주문이 없습니다' }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.orderId} order={order} locale={locale} />
      ))}
    </div>
  );
}
