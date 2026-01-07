import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ko', 'th', 'mm', 'en'] as const;
export const defaultLocale = 'ko' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale ?? defaultLocale;
  if (!locales.includes(currentLocale as Locale)) notFound();

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default,
  };
});
