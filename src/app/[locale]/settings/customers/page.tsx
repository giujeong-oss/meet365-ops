'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Edit2, Trash2, RefreshCw, Phone, MapPin, Clock } from 'lucide-react';
import { PageHeader, Button, Card, Input, Badge } from '@/components/ui';
import { getCustomers, createCustomer, updateCustomer } from '@/lib/firestore/customers';
import { Customer, CustomerInput } from '@/types';

export default function CustomersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CustomerInput>({
    code: '',
    name: '',
    zone: '',
    address: '',
    phone: '',
    timeConstraint: '',
    photoRequired: true,
    catchWeightTolerance: 3,
    isActive: true,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      zone: '',
      address: '',
      phone: '',
      timeConstraint: '',
      photoRequired: true,
      catchWeightTolerance: 3,
      isActive: true,
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      code: customer.code,
      name: customer.name,
      zone: customer.zone,
      address: customer.address || '',
      phone: customer.phone || '',
      timeConstraint: customer.timeConstraint || '',
      photoRequired: customer.photoRequired,
      catchWeightTolerance: customer.catchWeightTolerance || 3,
      isActive: customer.isActive,
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.zone) {
      alert('코드, 이름, 존은 필수입니다');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.customerId, formData);
      } else {
        await createCustomer(formData);
      }
      await loadCustomers();
      resetForm();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (customer: Customer) => {
    if (!confirm(`${customer.name}을(를) 비활성화 하시겠습니까?`)) return;

    try {
      await updateCustomer(customer.customerId, { isActive: false });
      await loadCustomers();
    } catch (error) {
      console.error('Failed to deactivate customer:', error);
      alert('비활성화 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <PageHeader
          title="고객 관리"
          backHref={`/${locale}/settings`}
          actions={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              고객 추가
            </Button>
          }
        />

        {/* Customer Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">
                {editingCustomer ? '고객 수정' : '신규 고객'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="고객 코드 *"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="DB1"
                    disabled={!!editingCustomer}
                  />
                  <Input
                    label="배송존 *"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="A7"
                  />
                </div>

                <Input
                  label="고객명 *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="다본푸드"
                />

                <Input
                  label="주소"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="서울시 강남구 테헤란로 123"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="전화번호"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="02-1234-5678"
                  />
                  <Input
                    label="시간제약"
                    value={formData.timeConstraint || ''}
                    onChange={(e) => setFormData({ ...formData, timeConstraint: e.target.value })}
                    placeholder="09:00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사진 필수
                    </label>
                    <select
                      value={formData.photoRequired ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, photoRequired: e.target.value === 'yes' })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                    >
                      <option value="yes">예</option>
                      <option value="no">아니오</option>
                    </select>
                  </div>
                  <Input
                    label="중량 허용오차(%)"
                    type="number"
                    value={formData.catchWeightTolerance?.toString() || '3'}
                    onChange={(e) => setFormData({ ...formData, catchWeightTolerance: parseInt(e.target.value) || 3 })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    취소
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? '저장중...' : editingCustomer ? '수정' : '추가'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Summary */}
        <Card padding="sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 {customers.length}개 고객</span>
            <Button variant="ghost" size="sm" onClick={loadCustomers}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </Card>

        {/* Customer List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : customers.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">등록된 고객이 없습니다</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              첫 고객 추가
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <Card key={customer.customerId} className="hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary-600">{customer.code}</span>
                      <span className="font-medium">{customer.name}</span>
                      {customer.photoRequired && (
                        <Badge color="blue" size="sm">사진필수</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>존: {customer.zone}</span>
                      </div>

                      {customer.timeConstraint && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{customer.timeConstraint}</span>
                        </div>
                      )}

                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    {customer.address && (
                      <p className="text-sm text-gray-400 mt-1">{customer.address}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(customer)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
