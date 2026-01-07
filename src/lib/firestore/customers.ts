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
import { Customer, CustomerInput, CustomerOption } from '@/types';
import { generateId } from '@/lib/utils';

const COLLECTION = 'customers';

// Get all active customers
export async function getCustomers(): Promise<Customer[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isActive', '==', true),
    orderBy('code', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Customer);
}

// Get customer by ID
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const docRef = doc(db, COLLECTION, customerId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Customer;
  }
  return null;
}

// Get customers as select options
export async function getCustomerOptions(): Promise<CustomerOption[]> {
  const customers = await getCustomers();

  return customers.map((c) => ({
    customerId: c.customerId,
    code: c.code,
    name: c.name,
    zone: c.zone,
    displayName: `${c.code} - ${c.name} (${c.zone})`,
  }));
}

// Create new customer
export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const customerId = generateId('CUS');
  const now = Timestamp.now();

  const customer: Customer = {
    ...input,
    customerId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTION, customerId), customer);
  return customer;
}

// Update customer
export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerInput>
): Promise<void> {
  const docRef = doc(db, COLLECTION, customerId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Seed mock customers (for development)
export async function seedMockCustomers(): Promise<void> {
  const mockCustomers: Omit<Customer, 'createdAt' | 'updatedAt'>[] = [
    {
      customerId: 'CUS-DB1',
      code: 'DB1',
      name: '다본푸드',
      zone: 'A7',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      timeConstraint: '09:00',
      photoRequired: true,
      catchWeightTolerance: 3,
      isActive: true,
    },
    {
      customerId: 'CUS-SY1',
      code: 'SY1',
      name: '성원물산',
      zone: 'B3',
      address: '서울시 서초구 반포대로 456',
      phone: '02-2345-6789',
      photoRequired: true,
      catchWeightTolerance: 5,
      isActive: true,
    },
    {
      customerId: 'CUS-HK1',
      code: 'HK1',
      name: '한국마트',
      zone: 'A2',
      address: '서울시 송파구 올림픽로 789',
      phone: '02-3456-7890',
      timeConstraint: '10:00',
      photoRequired: false,
      catchWeightTolerance: 3,
      isActive: true,
    },
    {
      customerId: 'CUS-JJ1',
      code: 'JJ1',
      name: '정정식품',
      zone: 'C5',
      address: '경기도 성남시 분당구 정자동 123',
      phone: '031-4567-8901',
      photoRequired: true,
      catchWeightTolerance: 3,
      isActive: true,
    },
    {
      customerId: 'CUS-MJ1',
      code: 'MJ1',
      name: '명진유통',
      zone: 'B1',
      address: '서울시 영등포구 여의대로 234',
      phone: '02-5678-9012',
      timeConstraint: '08:30',
      photoRequired: true,
      catchWeightTolerance: 5,
      isActive: true,
    },
  ];

  const batch = writeBatch(db);
  const now = Timestamp.now();

  for (const customer of mockCustomers) {
    const docRef = doc(db, COLLECTION, customer.customerId);
    batch.set(docRef, {
      ...customer,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`Seeded ${mockCustomers.length} mock customers`);
}
