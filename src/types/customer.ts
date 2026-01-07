import { BaseDocument } from './common';

export interface Customer extends BaseDocument {
  customerId: string;      // "MT-0022"
  code: string;            // "DB1" - 짧은 코드
  name: string;            // "다본푸드"
  zone: string;            // "A7" - 배송 구역
  address?: string;        // 주소
  phone?: string;          // 연락처
  timeConstraint?: string; // "09:00" - 배송 시간 제약
  photoRequired: boolean;  // 출고 시 사진 필수 여부
  catchWeightTolerance?: number; // 캐치웨이트 허용 오차 (%)
  isActive: boolean;       // 활성 상태
}

// For creating new customer (without auto-generated fields)
export type CustomerInput = Omit<Customer, 'customerId' | 'createdAt' | 'updatedAt'>;

// For display in select dropdown
export interface CustomerOption {
  customerId: string;
  code: string;
  name: string;
  zone: string;
  displayName: string; // "DB1 - 다본푸드 (A7)"
}
