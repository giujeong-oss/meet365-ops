import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductInput, ProductOption, LocalizedText } from '@/types';
import { generateId } from '@/lib/utils';

const COLLECTION = 'products';

// Get all active products
export async function getProducts(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    orderBy('category', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Product);
}

// Get product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  const docRef = doc(db, COLLECTION, productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Product;
  }
  return null;
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    where('category', '==', category)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Product);
}

// Get products as select options (with locale)
export async function getProductOptions(locale: string = 'ko'): Promise<ProductOption[]> {
  const products = await getProducts();
  const localeKey = locale as keyof LocalizedText;

  return products.map((p) => ({
    productId: p.productId,
    code: p.code,
    name: p.name[localeKey] || p.name.ko,
    category: p.category,
    categoryName: p.categoryName[localeKey] || p.categoryName.ko,
    unit: p.unit,
    isCatchWeight: p.isCatchWeight,
  }));
}

// Create new product
export async function createProduct(input: ProductInput): Promise<Product> {
  const productId = generateId('PRD');
  const now = Timestamp.now();

  const product: Product = {
    ...input,
    productId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTION, productId), product);
  return product;
}

// Update product
export async function updateProduct(
  productId: string,
  updates: Partial<ProductInput>
): Promise<void> {
  const docRef = doc(db, COLLECTION, productId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Seed mock products (for development)
export async function seedMockProducts(): Promise<void> {
  const mockProducts: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
    {
      productId: 'PRD-SG6P',
      code: '2-FP220001-T6',
      name: { ko: '삼겹 6피스컷', th: 'สามชั้นหั่น 6 ชิ้น', mm: 'ဝက်ဗိုက် ၆ပိုင်း', en: 'Pork Belly 6pc Cut' },
      category: 'samgyeop',
      categoryName: { ko: '삼겹', th: 'สามชั้น', mm: 'ဝက်ဗိုက်', en: 'Pork Belly' },
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.1,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-SGW',
      code: '2-FP220002-T1',
      name: { ko: '삼겹 통', th: 'สามชั้นชิ้นใหญ่', mm: 'ဝက်ဗိုက် အပြည့်', en: 'Pork Belly Whole' },
      category: 'samgyeop',
      categoryName: { ko: '삼겹', th: 'สามชั้น', mm: 'ဝက်ဗိုက်', en: 'Pork Belly' },
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.05,
      shelfLifeDays: 5,
      isActive: true,
    },
    {
      productId: 'PRD-MSS',
      code: '2-FP220003-T2',
      name: { ko: '목살 슬라이스', th: 'คอหมูสไลซ์', mm: 'ဝက်လည်ပင်း အချပ်', en: 'Pork Neck Sliced' },
      category: 'moksal',
      categoryName: { ko: '목살', th: 'คอหมู', mm: 'ဝက်လည်ပင်း', en: 'Pork Neck' },
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.15,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-MSW',
      code: '2-FP220004-T1',
      name: { ko: '목살 통', th: 'คอหมูชิ้นใหญ่', mm: 'ဝက်လည်ပင်း အပြည့်', en: 'Pork Neck Whole' },
      category: 'moksal',
      categoryName: { ko: '목살', th: 'คอหมู', mm: 'ဝက်လည်ပင်း', en: 'Pork Neck' },
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.05,
      shelfLifeDays: 5,
      isActive: true,
    },
    {
      productId: 'PRD-ASS',
      code: '2-FP220005-T2',
      name: { ko: '안심 슬라이스', th: 'สันในสไลซ์', mm: 'ဝက်ဆေး အချပ်', en: 'Tenderloin Sliced' },
      category: 'ansim',
      categoryName: { ko: '안심', th: 'สันใน', mm: 'ဝက်ဆေး', en: 'Tenderloin' },
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.2,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-CDS',
      code: '2-FB220001-T2',
      name: { ko: '차돌 슬라이스', th: 'เนื้อติดมันสไลซ์', mm: 'အဆီတက်အသား အချပ်', en: 'Brisket Sliced' },
      category: 'chadol',
      categoryName: { ko: '차돌', th: 'เนื้อติดมัน', mm: 'အဆီတက်အသား', en: 'Brisket' },
      species: 'beef',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.1,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-ACS',
      code: '2-FB220002-T2',
      name: { ko: '안창살', th: 'เนื้อสันแหลม', mm: 'အတွင်းသားညှပ်', en: 'Inside Skirt' },
      category: 'anchang',
      categoryName: { ko: '안창살', th: 'เนื้อสันแหลม', mm: 'အတွင်းသားညှပ်', en: 'Inside Skirt' },
      species: 'beef',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.1,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-SGS',
      code: '2-FB220003-T2',
      name: { ko: '소갈비살', th: 'เนื้อซี่โครง', mm: 'နွားနံရိုးသား', en: 'Beef Rib Meat' },
      category: 'sogalbi',
      categoryName: { ko: '소갈비', th: 'ซี่โครงวัว', mm: 'နွားနံရိုး', en: 'Beef Ribs' },
      species: 'beef',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.15,
      shelfLifeDays: 3,
      isActive: true,
    },
    {
      productId: 'PRD-YHY',
      code: '2-FB220004-T2',
      name: { ko: '육회용', th: 'เนื้อสำหรับยุกเฮ', mm: 'အသားစိမ်းစားသုံး', en: 'Beef Tartare Cut' },
      category: 'yukhoe',
      categoryName: { ko: '육회', th: 'ยุกเฮ', mm: 'ယုခွေး', en: 'Yukhoe' },
      species: 'beef',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.2,
      shelfLifeDays: 2,
      isActive: true,
    },
  ];

  const batch = writeBatch(db);
  const now = Timestamp.now();

  for (const product of mockProducts) {
    const docRef = doc(db, COLLECTION, product.productId);
    batch.set(docRef, {
      ...product,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`Seeded ${mockProducts.length} mock products`);
}
