'use client';

import Link from 'next/link';
import { Clock, Package, MapPin } from 'lucide-react';
import { Card } from '@/components/ui';
import { StatusBadge } from '@/components/ui/Badge';
import { OrderSummary } from '@/types';
import { formatWeight } from '@/lib/utils';

interface OrderCardProps {
  order: OrderSummary;
  locale?: string;
}

export function OrderCard({ order, locale = 'ko' }: OrderCardProps) {
  return (
    <Link href={`/${locale}/orders/${order.orderId}`}>
      <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary-600">{order.customerCode}</span>
              <span className="text-gray-600">{order.customerName}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{order.orderId}</p>
          </div>
          <StatusBadge status={order.status} size="sm" />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{order.zone}</span>
          </div>

          {order.timeConstraint && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{order.timeConstraint}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>{order.itemCount}품목</span>
          </div>

          <span className="font-medium text-gray-700">
            {formatWeight(order.totalWeight)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
