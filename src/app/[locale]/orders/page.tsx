'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, RefreshCw } from 'lucide-react';
import { PageHeader, Button, Card } from '@/components/ui';
import { OrderList } from '@/components/orders';
import { getOrdersByDate } from '@/lib/firestore/orders';
import { OrderSummary, OrderStatus } from '@/types';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'ordered', label: '주문접수' },
  { value: 'producing', label: '생산중' },
  { value: 'produced', label: '생산완료' },
  { value: 'released', label: '출고완료' },
];

export default function OrdersPage() {
  const t = useTranslations('orders');
  const params = useParams();
  const locale = params.locale as string;
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrdersByDate(selectedDate);
      const summaries: OrderSummary[] = data.map((order) => ({
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
      setOrders(summaries);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader
          title={t('title')}
          backHref={`/${locale}`}
          actions={
            <Link href={`/${locale}/orders/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-1" />
                {t('newOrder')}
              </Button>
            </Link>
          }
        />

        {/* Date Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-card">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none focus:outline-none text-sm"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={loadOrders}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Status Summary */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((filter) => {
            const count = filter.value === 'all'
              ? orders.length
              : statusCounts[filter.value] || 0;

            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  ${statusFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {filter.label}
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs
                  ${statusFilter === filter.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-500">로딩중...</p>
          </div>
        ) : (
          <OrderList
            orders={filteredOrders}
            emptyMessage={`${selectedDate} 주문이 없습니다`}
          />
        )}

        {/* Summary Footer */}
        {!loading && orders.length > 0 && (
          <Card className="mt-4" padding="sm">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                총 {filteredOrders.length}건
              </span>
              <span className="font-medium text-gray-700">
                총 {filteredOrders.reduce((sum, o) => sum + o.totalWeight, 0).toFixed(1)}kg
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
