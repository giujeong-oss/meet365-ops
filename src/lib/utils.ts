import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
    case 'long':
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    case 'time':
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    default:
      return d.toLocaleDateString('ko-KR');
  }
}

// Generate ID with prefix
export function generateId(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${dateStr}-${random}`;
}

// Weight formatting
export function formatWeight(weight: number, unit: string = 'kg'): string {
  return `${weight.toFixed(1)}${unit}`;
}

// Percentage formatting
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Currency formatting (Thai Baht)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}
