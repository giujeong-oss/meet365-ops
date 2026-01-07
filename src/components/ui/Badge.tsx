'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      error: 'bg-error-100 text-error-700',
      info: 'bg-primary-100 text-primary-700',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge for Orders
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { variant: BadgeProps['variant']; label: string }> = {
  ordered: { variant: 'default', label: '주문접수' },
  producing: { variant: 'info', label: '생산중' },
  produced: { variant: 'success', label: '생산완료' },
  released: { variant: 'warning', label: '출고완료' },
  dispatched: { variant: 'info', label: '배차완료' },
  delivered: { variant: 'success', label: '배송완료' },
  cancelled: { variant: 'error', label: '취소' },
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={className}
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge };
