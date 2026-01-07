'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Database, Users, Package, RefreshCw, Check, ChevronRight, Settings2 } from 'lucide-react';
import { PageHeader, Button, Card } from '@/components/ui';
import { seedMockCustomers } from '@/lib/firestore/customers';
import { seedMockProducts } from '@/lib/firestore/products';

export default function SettingsPage() {
  const t = useTranslations('nav');
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState({ customers: false, products: false });

  const handleSeedCustomers = async () => {
    setSeeding(true);
    try {
      await seedMockCustomers();
      setSeeded((prev) => ({ ...prev, customers: true }));
      alert('고객 목업 데이터가 추가되었습니다');
    } catch (error) {
      console.error('Failed to seed customers:', error);
      alert('고객 시딩 실패');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    try {
      await seedMockProducts();
      setSeeded((prev) => ({ ...prev, products: true }));
      alert('제품 목업 데이터가 추가되었습니다');
    } catch (error) {
      console.error('Failed to seed products:', error);
      alert('제품 시딩 실패');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      await Promise.all([seedMockCustomers(), seedMockProducts()]);
      setSeeded({ customers: true, products: true });
      alert('모든 목업 데이터가 추가되었습니다');
    } catch (error) {
      console.error('Failed to seed data:', error);
      alert('시딩 실패');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title={t('settings')} backHref="/" />

        {/* Master Data Management */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">마스터 데이터 관리</h3>
          </div>

          <div className="space-y-2">
            <Link href="/ko/settings/customers">
              <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">고객 관리</p>
                    <p className="text-sm text-gray-500">고객 추가, 수정, 삭제</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>

            <Link href="/ko/settings/products">
              <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">제품 관리</p>
                    <p className="text-sm text-gray-500">제품 추가, 수정, 삭제</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>

        {/* Development Tools */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">개발 도구</h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            테스트용 목업 데이터를 Firestore에 추가합니다.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm">고객 마스터 (5건)</span>
                {seeded.customers && <Check className="w-4 h-4 text-success-500" />}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSeedCustomers}
                disabled={seeding}
              >
                시딩
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm">제품 마스터 (6건)</span>
                {seeded.products && <Check className="w-4 h-4 text-success-500" />}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSeedProducts}
                disabled={seeding}
              >
                시딩
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              className="w-full"
              onClick={handleSeedAll}
              disabled={seeding}
              isLoading={seeding}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              전체 시딩
            </Button>
          </div>
        </Card>

        {/* Info */}
        <Card variant="outlined" padding="sm">
          <p className="text-xs text-gray-400 text-center">
            Meet365 OPS v0.1.0 | Firebase: meet365-12ce8
          </p>
        </Card>
      </div>
    </div>
  );
}
