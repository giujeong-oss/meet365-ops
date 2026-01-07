'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import { getOrderWithItems, updateOrderStatus } from '@/lib/firestore/orders';
import { OrderWithItems, OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: '주문접수',
  producing: '생산중',
  produced: '생산완료',
  released: '출고완료',
  dispatched: '배차완료',
  delivered: '배송완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<OrderStatus, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  ordered: 'blue',
  producing: 'yellow',
  produced: 'green',
  released: 'green',
  dispatched: 'blue',
  delivered: 'gray',
  cancelled: 'red',
};

const STATUS_FLOW: OrderStatus[] = [
  'ordered',
  'producing',
  'produced',
  'released',
  'dispatched',
  'delivered',
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderWithItems(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || updating) return;

    try {
      setUpdating(true);
      await updateOrderStatus(orderId, newStatus);
      setOrder({ ...order, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('상태 업데이트 실패');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (): OrderStatus | null => {
    if (!order || order.status === 'cancelled') return null;
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  const getPrevStatus = (): OrderStatus | null => {
    if (!order || order.status === 'cancelled') return null;
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex <= 0) return null;
    return STATUS_FLOW[currentIndex - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <PageHeader title="주문을 찾을 수 없습니다" backHref="/ko/orders" />
        <Card className="text-center py-8">
          <p className="text-gray-500">주문 ID: {orderId}</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/ko/orders')}>
            주문 목록으로
          </Button>
        </Card>
      </div>
    );
  }

  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <PageHeader
          title={`주문 ${order.orderId}`}
          backHref="/ko/orders"
        />

        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">주문 상태</h2>
            <Badge color={STATUS_COLORS[order.status]} size="md">
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>

          {/* Status Progress */}
          <div className="flex items-center space-x-1 mb-4 overflow-x-auto pb-2">
            {STATUS_FLOW.map((status, index) => {
              const currentIndex = STATUS_FLOW.indexOf(order.status);
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={status} className="flex items-center">
                  <div
                    className={`
                      px-2 py-1 rounded text-xs whitespace-nowrap
                      ${isCurrent ? 'bg-blue-500 text-white font-bold' : ''}
                      ${isCompleted && !isCurrent ? 'bg-green-100 text-green-700' : ''}
                      ${!isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                  >
                    {STATUS_LABELS[status]}
                  </div>
                  {index < STATUS_FLOW.length - 1 && (
                    <span className={`mx-1 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Actions */}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="flex space-x-2">
              {prevStatus && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusUpdate(prevStatus)}
                  disabled={updating}
                >
                  ← {STATUS_LABELS[prevStatus]}
                </Button>
              )}
              {nextStatus && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating}
                >
                  {STATUS_LABELS[nextStatus]} →
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
                className="text-red-600 hover:bg-red-50 ml-auto"
              >
                주문 취소
              </Button>
            </div>
          )}
        </Card>

        {/* Customer Info */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">고객 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">고객명</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">고객코드</p>
              <p className="font-medium">{order.customerCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">배송존</p>
              <p className="font-medium">{order.zone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">시간제약</p>
              <p className="font-medium">{order.timeConstraint || '-'}</p>
            </div>
          </div>
        </Card>

        {/* Order Info */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">주문 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">배송일</p>
              <p className="font-medium">{order.deliveryDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">주문경로</p>
              <p className="font-medium uppercase">{order.source}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">품목수</p>
              <p className="font-medium">{order.itemCount}건</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">총 중량</p>
              <p className="font-medium">{order.totalWeight}kg</p>
            </div>
          </div>
          {order.note && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">메모</p>
              <p className="font-medium">{order.note}</p>
            </div>
          )}
        </Card>

        {/* Order Items */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">주문 품목</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {item.orderedQty}{item.unit}
                  </p>
                  {item.actualQty && (
                    <p className="text-sm text-gray-500">
                      실제: {item.actualQty}{item.unit}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-gray-600">합계</span>
            <span className="text-xl font-bold">{order.totalWeight}kg</span>
          </div>
        </Card>

        {/* Timestamps */}
        <Card className="text-sm text-gray-500">
          <div className="flex justify-between">
            <span>생성: {order.createdAt?.toDate?.()?.toLocaleString('ko-KR') || '-'}</span>
            <span>수정: {order.updatedAt?.toDate?.()?.toLocaleString('ko-KR') || '-'}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
