import { BaseDocument, LocalizedText } from './common';

export interface Product extends BaseDocument {
  productId: string;         // "2-FP220001-T6"
  code: string;              // "2-FP220001-T6"
  name: LocalizedText;       // { ko: "삼겹 6피스컷", th: "...", ... }
  category: string;          // "samgyeop"
  categoryName: LocalizedText; // { ko: "삼겹", th: "สามชั้น", ... }
  species: 'pork' | 'beef' | 'chicken';
  unit: string;              // "kg"
  isCatchWeight: boolean;    // 캐치웨이트 제품 여부
  rawMaterialRatio?: number; // 원육 소요량 비율 (1kg 생산에 필요한 원육 kg)
  shelfLifeDays?: number;    // 유통기한 일수
  isActive: boolean;
}

// For creating new product
export type ProductInput = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;

// For display in select dropdown
export interface ProductOption {
  productId: string;
  code: string;
  name: string;       // Current locale name
  category: string;
  categoryName: string; // Current locale category
  unit: string;
  isCatchWeight: boolean;
}

// Category definition
export interface Category {
  id: string;
  name: LocalizedText;
  species: 'pork' | 'beef' | 'chicken';
  color: string; // Tailwind color class
}

// Predefined categories
export const MEAT_CATEGORIES: Category[] = [
  { id: 'samgyeop', name: { ko: '삼겹', th: 'สามชั้น', mm: 'ဝက်ဗိုက်', en: 'Pork Belly' }, species: 'pork', color: 'bg-pink-500' },
  { id: 'moksal', name: { ko: '목살', th: 'คอหมู', mm: 'ဝက်လည်ပင်း', en: 'Pork Neck' }, species: 'pork', color: 'bg-rose-500' },
  { id: 'ansim', name: { ko: '안심', th: 'สันใน', mm: 'ဝက်ဆေး', en: 'Tenderloin' }, species: 'pork', color: 'bg-red-400' },
  { id: 'deungsim', name: { ko: '등심', th: 'สันนอก', mm: 'ဝက်ကျောသား', en: 'Loin' }, species: 'pork', color: 'bg-red-500' },
  { id: 'chadol', name: { ko: '차돌', th: 'เนื้อติดมัน', mm: 'အဆီတက်အသား', en: 'Brisket' }, species: 'beef', color: 'bg-amber-600' },
  { id: 'galbi', name: { ko: '갈비', th: 'ซี่โครง', mm: 'နံရိုး', en: 'Ribs' }, species: 'pork', color: 'bg-orange-500' },
];
