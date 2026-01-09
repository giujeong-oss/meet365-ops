'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  Factory,
  Package,
  Truck,
  LayoutDashboard,
  Settings
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('nav');
  const params = useParams();
  const locale = params.locale as string;

  const menuItems = [
    { href: `/${locale}/orders`, icon: ClipboardList, label: t('orders'), color: 'bg-blue-500' },
    { href: `/${locale}/production`, icon: Factory, label: t('production'), color: 'bg-green-500' },
    { href: `/${locale}/inventory`, icon: Package, label: t('inventory'), color: 'bg-purple-500' },
    { href: `/${locale}/release`, icon: Truck, label: t('release'), color: 'bg-orange-500' },
    { href: `/${locale}/monitor`, icon: LayoutDashboard, label: t('monitor'), color: 'bg-cyan-500' },
    { href: `/${locale}/settings`, icon: Settings, label: t('settings'), color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-600">Meet365 OPS</h1>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 flex flex-col items-center gap-3"
            >
              <div className={`${item.color} p-4 rounded-full`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-lg font-medium text-gray-700">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="오늘 주문" value="12" unit="건" />
          <StatCard title="생산 진행" value="8" unit="건" />
          <StatCard title="출고 대기" value="5" unit="건" />
          <StatCard title="재고 정확도" value="87" unit="%" />
        </div>
      </main>
    </div>
  );
}

function LanguageSwitcher() {
  const params = useParams();
  const currentLocale = params.locale as string;
  const locales = ['ko', 'th', 'mm', 'en'];

  return (
    <div className="flex gap-2">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={`/${loc}`}
          className={`px-2 py-1 text-sm rounded hover:bg-gray-100 ${
            currentLocale === loc ? 'bg-primary-100 text-primary-600 font-medium' : ''
          }`}
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

function StatCard({ title, value, unit }: { title: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">
        {value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}
