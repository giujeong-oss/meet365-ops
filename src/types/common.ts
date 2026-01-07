import { Timestamp } from 'firebase/firestore';

// Localized text for multi-language support
export interface LocalizedText {
  ko: string;
  th: string;
  mm: string;
  en: string;
}

// Order status flow
export type OrderStatus =
  | 'ordered'     // 주문접수
  | 'producing'   // 생산중
  | 'produced'    // 생산완료
  | 'released'    // 출고완료
  | 'dispatched'  // 배차완료
  | 'delivered'   // 배송완료
  | 'cancelled';  // 취소

// Order item status
export type ItemStatus =
  | 'pending'     // 대기
  | 'completed';  // 완료

// Order source
export type OrderSource =
  | 'line'        // LINE 주문
  | 'phone'       // 전화 주문
  | 'manual';     // 직접 입력

// Meat categories
export type MeatCategory =
  | 'samgyeop'    // 삼겹
  | 'moksal'      // 목살
  | 'ansim'       // 안심
  | 'deungsim'    // 등심
  | 'chadol'      // 차돌
  | 'galbi';      // 갈비

// Firebase Timestamp type helper
export type FirebaseTimestamp = Timestamp;

// Base document interface
export interface BaseDocument {
  createdAt: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}
