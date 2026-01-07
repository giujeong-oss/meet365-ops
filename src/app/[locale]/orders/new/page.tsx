'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Save, Wand2, AlertCircle } from 'lucide-react';
import { PageHeader, Button, Card, Select, Input } from '@/components/ui';
import { getCustomerOptions } from '@/lib/firestore/customers';
import { getProductOptions } from '@/lib/firestore/products';
import { createOrder } from '@/lib/firestore/orders';
import { CustomerOption, ProductOption, OrderSource } from '@/types';
import { parseOrderMessage, ParsedItem } from '@/lib/utils/parseOrderMessage';

interface OrderItemForm {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export default function NewOrderPage() {
  const t = useTranslations('orders');
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [source, setSource] = useState<OrderSource>('manual');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([]);
  const [orderMessage, setOrderMessage] = useState('');
  const [parseResults, setParseResults] = useState<ParsedItem[]>([]);

  // Load master data
  useEffect(() => {
    async function loadData() {
      try {
        const [customerData, productData] = await Promise.all([
          getCustomerOptions(),
          getProductOptions('ko'),
        ]);
        setCustomers(customerData);
        setProducts(productData);
      } catch (error) {
        console.error('Failed to load master data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: '',
        productName: '',
        quantity: 0,
        unit: 'kg',
      },
    ]);
  };

  // Update item
  const updateItem = (id: string, field: keyof OrderItemForm, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        if (field === 'productId') {
          const product = products.find((p) => p.productId === value);
          return {
            ...item,
            productId: value as string,
            productName: product?.name || '',
            unit: product?.unit || 'kg',
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Parse order message
  const handleParseMessage = () => {
    if (!orderMessage.trim()) return;

    const parsed = parseOrderMessage(orderMessage, products);
    setParseResults(parsed);

    // Add matched items to the list
    const newItems: OrderItemForm[] = parsed
      .filter((p) => p.matched)
      .map((p) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
      }));

    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
  };

  // Clear message input
  const handleClearMessage = () => {
    setOrderMessage('');
    setParseResults([]);
  };

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Submit order
  const handleSubmit = async () => {
    if (!customerId) {
      alert('고객을 선택해주세요');
      return;
    }

    if (items.length === 0) {
      alert('품목을 추가해주세요');
      return;
    }

    const validItems = items.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      alert('유효한 품목이 없습니다');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        customerId,
        deliveryDate,
        source,
        note: note || undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          orderedQty: item.quantity,
        })),
      });

      alert(`주문이 등록되었습니다: ${order.orderId}`);
      router.push('/ko/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('주문 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title={t('newOrder')}
          backHref="/ko/orders"
        />

        {/* Customer & Date */}
        <Card className="mb-4">
          <div className="space-y-4">
            <Select
              label="고객"
              placeholder="고객을 선택하세요"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customers.map((c) => ({
                value: c.customerId,
                label: c.displayName,
              }))}
            />

            <Input
              label="배송일"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />

            <Select
              label="주문 출처"
              value={source}
              onChange={(e) => setSource(e.target.value as OrderSource)}
              options={[
                { value: 'line', label: 'LINE' },
                { value: 'phone', label: '전화' },
                { value: 'manual', label: '직접 입력' },
              ]}
            />
          </div>
        </Card>

        {/* Message Parser */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">주문 메시지 파싱</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            LINE/전화 주문 메시지를 붙여넣으면 품목이 자동으로 추가됩니다
          </p>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
            placeholder={`예시:\n삼겹 6피스컷 10kg\n목살 슬라이스 5kg\n차돌 3kg`}
            value={orderMessage}
            onChange={(e) => setOrderMessage(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleParseMessage}
              disabled={!orderMessage.trim()}
            >
              <Wand2 className="w-4 h-4 mr-1" />
              파싱하여 추가
            </Button>
            {orderMessage && (
              <Button variant="ghost" size="sm" onClick={handleClearMessage}>
                초기화
              </Button>
            )}
          </div>

          {/* Parse Results */}
          {parseResults.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">파싱 결과:</p>
              <div className="space-y-1">
                {parseResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`text-sm px-2 py-1 rounded flex items-center gap-2 ${
                      result.matched
                        ? 'bg-success-50 text-success-700'
                        : 'bg-warning-50 text-warning-700'
                    }`}
                  >
                    {!result.matched && <AlertCircle className="w-4 h-4" />}
                    <span>
                      {result.matched ? '✓' : '?'} {result.originalText} →{' '}
                      {result.matched
                        ? `${result.productName} ${result.quantity}${result.unit}`
                        : '매칭 실패'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Order Items */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">주문 품목</h3>
            <Button variant="secondary" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              품목 추가
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              메시지를 파싱하거나 품목을 직접 추가해주세요
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <Select
                      label={`품목 ${index + 1}`}
                      placeholder="제품 선택"
                      value={item.productId}
                      onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                      options={products.map((p) => ({
                        value: p.productId,
                        label: `${p.name} (${p.categoryName})`,
                      }))}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="수량"
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      placeholder="kg"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-error-500 hover:bg-error-50 mb-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <span className="text-gray-500">총 {items.filter(i => i.productId).length}품목</span>
              <span className="font-semibold text-gray-900">{totalWeight.toFixed(1)} kg</span>
            </div>
          )}
        </Card>

        {/* Note */}
        <Card className="mb-6">
          <Input
            label="메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="주문 관련 메모 (선택)"
          />
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!customerId || items.length === 0}
        >
          <Save className="w-5 h-5 mr-2" />
          주문 등록
        </Button>
      </div>
    </div>
  );
}
