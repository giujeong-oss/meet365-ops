# Meet365 통합 운영 시스템 (OPS)

> **프로젝트**: meet365-ops
> **버전**: MVP v2.0
> **목표**: 주문-생산-출고-배송-재고 통합 관리
> **마지막 업데이트**: 2026-01-05

---

## 🎯 프로젝트 개요

### 해결하려는 문제
1. **주문 현황 파악 불가** - 오늘 주문이 어디까지 진행됐는지 모름
2. **생산 추적 불가** - 제품별 생산량/사진이 흩어져 있음
3. **재고 불일치** - 시스템 재고 ≠ 실제 재고 (현재 정확도 ~30%)
4. **배차 혼란** - 어떤 차에 뭘 실었는지 불명확
5. **클레임 대응 어려움** - 증빙 사진 찾기 어려움

### 핵심 플로우
```
[입고] → [원육재고+] → [생산지시] → [생산입력] → [원육재고-, 완제품재고+]
                                         ↓
[주문접수] → [주문현황판] ←──────────────┘
                ↓
[출고확인] → [완제품재고-] → [배차] → [배송완료]
```

### 기술 스택
| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Style | Tailwind CSS (Meet365 CI) |
| Backend | Firebase Firestore |
| Storage | Firebase Storage (사진) |
| Auth | 없음 (MVP), 추후 LINE LIFF |
| Deploy | Vercel |
| i18n | next-intl (ko/th/mm/en) |

---

## 📦 점진적 재고 정확도 향상 전략

### 현황 및 목표

| 단계 | 기간 | 목표 정확도 | 핵심 활동 |
|:----:|------|:----------:|----------|
| **0** | 현재 | ~30% | 시스템 없음, 수기 추정 |
| **1** | 1-2주 | 50% | 입고 기록 시작, 창고별 기준점 |
| **2** | 3-4주 | 70% | 일일 실사 (핵심 품목), 생산 연동 |
| **3** | 5-8주 | 85% | 전체 실사 완료, 자동 차감 안정화 |
| **4** | 9주+ | 95%+ | 예외 관리, 지속적 개선 |

---

### Phase 1: 기준점 설정 (50% 목표)

#### 전략: "입고부터 정확하게"

```
기존 재고 = 추정값 (신뢰도 낮음)
신규 입고 = 정확값 (신뢰도 100%)

→ 신규 입고분만 정확히 추적
→ 기존 재고는 "Legacy" 표시
→ 시간이 지나면 Legacy 자연 소진
```

#### 데이터 구조

```javascript
raw_stock/{stockId}
{
  // ... 기본 필드 ...
  
  // 신뢰도 관리
  dataSource: "counted",           // legacy | receiving | counted
  confidence: 100,                 // 0-100%
  lastCountedAt: timestamp,        // 마지막 실사일
  
  // Legacy 구분
  isLegacy: false,                 // true = 기존 재고 (추정값)
  legacyNote: null                 // "2026-01-05 기준 추정값"
}
```

#### 실행 방법

1. **시스템 시작 시 Legacy 등록**
   ```
   모든 기존 재고 → dataSource: "legacy", confidence: 30
   ```

2. **신규 입고만 정확히 기록**
   ```
   입고 등록 → dataSource: "receiving", confidence: 100
   ```

3. **생산 시 Legacy 우선 소진**
   ```
   FIFO 원칙 + Legacy 우선
   Legacy 재고 먼저 차감 → 신규 재고 차감
   ```

---

### Phase 2: 창고별 순차 실사 (70% 목표)

#### 전략: "한 번에 다 하지 말고, 창고별로"

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 냉장고A │ → │ 냉장고B │ → │ 냉동실  │ → │ 가공실  │
│ Week 1  │    │ Week 2  │    │ Week 3  │    │ Week 4  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

#### 창고 마스터

```javascript
warehouses/{warehouseId}
{
  warehouseId: "WH-A",
  name: "냉장고A",
  type: "refrigerator",           // refrigerator | freezer | processing
  
  // 실사 관리
  lastCountDate: "2026-01-05",
  nextCountDate: "2026-01-12",    // 주간 실사
  countCycle: 7,                  // 일 단위
  
  // 정확도 추적
  accuracy: 85,                   // 마지막 실사 후 정확도
  itemCount: 5,                   // 보관 품목 수
  
  // 담당자
  responsiblePerson: "쏨차이"
}
```

#### 실사 프로세스

```javascript
stock_counts/{countId}
{
  countId: "CNT260105-001",
  date: "2026-01-05",
  
  // 범위
  warehouseId: "WH-A",
  warehouseName: "냉장고A",
  countType: "full",              // full | partial | spot
  
  // 실사 결과
  items: [
    {
      stockId: "RAW260105-001",
      category: "삼겹",
      lotNo: "L260104-001",
      
      // 비교
      systemQty: 120.5,           // 시스템 재고
      countedQty: 115.0,          // 실사 재고
      variance: -5.5,             // 차이
      variancePercent: -4.6,      // 차이율
      
      // 조치
      action: "adjust",           // none | adjust | investigate
      note: "자연 감모 추정"
    }
  ],
  
  // 요약
  totalItems: 5,
  matchedItems: 3,                // 일치 (±1%)
  varianceItems: 2,               // 차이 발생
  
  // 조정 적용
  adjustmentApplied: true,
  adjustedAt: timestamp,
  adjustedBy: "Giu",
  
  // 메타
  countedBy: "쏨차이",
  countedAt: timestamp,
  approvedBy: "Giu",
  approvedAt: timestamp
}
```

#### 실사 화면 (/inventory/count)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 재고 실사                              냉장고A | 2026-01-05  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  품목        Lot           시스템    실사     차이    상태      │
│  ──────────────────────────────────────────────────────────────│
│  🥩 삼겹    L260104-001   120.5kg  [115  ]   -5.5   ⚠️         │
│  🥓 목살    L260104-002    85.0kg  [85   ]    0     ✅         │
│  🥩 안심    L260103-001    25.0kg  [24.5 ]   -0.5   ✅         │
│  🔴 차돌    L260102-001    15.0kg  [12   ]   -3.0   ⚠️         │
│  🥩 등심    L260104-003    40.0kg  [40   ]    0     ✅         │
│                                                                 │
│  총계: 시스템 285.5kg | 실사 276.5kg | 차이 -9.0kg (-3.2%)     │
│                                                                 │
│  [이전 품목]                              [다음 품목]           │
│                                                                 │
│  ⚠️ 차이 품목 2건 - 조정 승인 필요                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     [실사 완료 → 승인 요청]                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: 자동 차감 안정화 (85% 목표)

#### 전략: "모든 이동을 기록"

```
입고 → +재고 (자동)
생산 → -원육, +완제품 (자동)
출고 → -완제품 (자동)
폐기/조정 → ±재고 (승인 후)
```

#### 자동 재고 연동 로직

```typescript
// 생산 완료 시 자동 재고 차감
async function onProductionComplete(record: ProductionRecord) {
  const batch = writeBatch(db);
  
  // 1. 원육 재고 차감 (FIFO + Legacy 우선)
  const rawStocks = await getRawStocksByCategory(record.category);
  const sorted = rawStocks.sort((a, b) => {
    // Legacy 우선
    if (a.isLegacy && !b.isLegacy) return -1;
    // 그 다음 유통기한 임박순
    return a.expiryDate - b.expiryDate;
  });
  
  let remaining = record.actualQty * RAW_MATERIAL_RATIO;
  for (const stock of sorted) {
    if (remaining <= 0) break;
    
    const deduct = Math.min(stock.availableQty, remaining);
    batch.update(doc(db, 'raw_stock', stock.stockId), {
      quantity: increment(-deduct),
      availableQty: increment(-deduct)
    });
    
    // 이동 기록
    batch.set(doc(collection(db, 'stock_movements')), {
      type: 'production_out',
      stockId: stock.stockId,
      quantity: -deduct,
      referenceId: record.recordId,
      // ...
    });
    
    remaining -= deduct;
  }
  
  // 2. 완제품 재고 증가
  batch.set(doc(db, 'product_stock', record.recordId), {
    productId: record.productId,
    quantity: record.actualQty,
    // ...
  });
  
  await batch.commit();
}
```

---

### Phase 4: 지속적 개선 (95%+ 목표)

#### 일일 점검 루틴

| 시간 | 활동 | 담당 |
|------|------|------|
| 06:00 | 전일 재고 마감 확인 | 시스템 |
| 07:00 | 입고 예정 확인 | 입고 담당 |
| 08:00 | 생산 시작 전 재고 확인 | 생산 담당 |
| 17:00 | 일일 Spot 실사 (1-2개 품목) | 순환 |
| 18:00 | 차이 분석 및 조정 | 관리자 |

#### KPI 대시보드

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 재고 정확도 현황                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  전체 정확도: 87% ████████████████░░░░                         │
│                                                                 │
│  창고별 정확도:                                                  │
│  냉장고A   95% ███████████████████░                            │
│  냉장고B   82% ████████████████░░░░                            │
│  냉동실    78% ███████████████░░░░░                            │
│  가공실    92% ██████████████████░░                            │
│                                                                 │
│  이번 주 실사: 냉장고B (예정: 01/07)                            │
│  다음 주 실사: 냉동실 (예정: 01/14)                             │
│                                                                 │
│  ⚠️ 주의 품목:                                                  │
│  • 차돌: 시스템 15kg, 추정 12kg (20% 차이)                      │
│  • 안심: 3주간 실사 미실시                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 다국어 지원 (i18n)

| 코드 | 언어 | 사용자 |
|:----:|------|--------|
| ko | 한국어 | 관리자, 한국인 직원 |
| th | ภาษาไทย | 태국인 직원 |
| mm | မြန်မာ | 미얀마 직원 |
| en | English | 공통 |

---

## 📁 프로젝트 구조

```
meet365-ops/
├── CLAUDE.md
├── package.json
├── next.config.js
├── tailwind.config.js
│
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 메인 대시보드
│   │   │
│   │   ├── orders/                     # 주문 관리
│   │   │   ├── page.tsx                # 주문 목록
│   │   │   ├── new/page.tsx            # 주문 접수
│   │   │   └── [orderId]/
│   │   │       ├── page.tsx            # 주문 상세
│   │   │       └── edit/page.tsx       # 주문 수정
│   │   │
│   │   ├── production/                 # 생산 관리
│   │   │   ├── page.tsx                # 생산지시 목록
│   │   │   └── [batchId]/page.tsx      # 생산 입력
│   │   │
│   │   ├── release/                    # 출고 관리
│   │   │   ├── page.tsx                # 출고 대기 목록
│   │   │   └── [customerId]/page.tsx   # 출고 확인
│   │   │
│   │   ├── dispatch/                   # 배차 관리
│   │   │   └── page.tsx                # 배차 (자동+수동)
│   │   │
│   │   ├── inventory/                  # 📦 재고 관리
│   │   │   ├── page.tsx                # 재고 대시보드
│   │   │   ├── raw/                    # 원육 재고
│   │   │   │   ├── page.tsx            # 원육 목록
│   │   │   │   └── [category]/page.tsx # 부위별 상세
│   │   │   ├── product/                # 완제품 재고
│   │   │   │   └── page.tsx            # 완제품 목록
│   │   │   ├── receive/                # 입고
│   │   │   │   ├── page.tsx            # 입고 목록
│   │   │   │   └── new/page.tsx        # 입고 등록
│   │   │   ├── count/                  # 실사
│   │   │   │   ├── page.tsx            # 실사 목록/일정
│   │   │   │   ├── new/page.tsx        # 실사 시작
│   │   │   │   └── [countId]/page.tsx  # 실사 입력
│   │   │   ├── adjust/                 # 조정
│   │   │   │   └── page.tsx            # 재고 조정
│   │   │   └── history/                # 이력
│   │   │       └── page.tsx            # 입출고 이력
│   │   │
│   │   ├── monitor/                    # 현황판 (모니터)
│   │   │   ├── orders/page.tsx         # 주문현황판
│   │   │   ├── production/page.tsx     # 생산현황판
│   │   │   ├── delivery/page.tsx       # 배송현황판
│   │   │   └── inventory/page.tsx      # 재고현황판
│   │   │
│   │   └── settings/                   # 설정
│   │       ├── products/page.tsx       # 제품 마스터
│   │       ├── suppliers/page.tsx      # 공급처 마스터
│   │       ├── warehouses/page.tsx     # 창고 마스터
│   │       └── customers/page.tsx      # 고객 마스터
│   │
│   └── api/
│       └── ...
│
├── components/
│   ├── ui/                             # 공통 UI
│   ├── orders/                         # 주문 컴포넌트
│   ├── production/                     # 생산 컴포넌트
│   ├── release/                        # 출고 컴포넌트
│   ├── dispatch/                       # 배차 컴포넌트
│   ├── inventory/                      # 재고 컴포넌트
│   │   ├── StockDashboard.tsx
│   │   ├── RawStockList.tsx
│   │   ├── ProductStockList.tsx
│   │   ├── ReceiveForm.tsx
│   │   ├── CountForm.tsx               # 실사 입력
│   │   ├── AdjustForm.tsx
│   │   ├── StockAlert.tsx              # 부족/만료 알림
│   │   └── AccuracyGauge.tsx           # 정확도 게이지
│   └── monitor/                        # 현황판 컴포넌트
│
├── lib/
│   ├── firebase.ts
│   ├── firestore/
│   │   ├── orders.ts
│   │   ├── production.ts
│   │   ├── release.ts
│   │   ├── dispatch.ts
│   │   ├── inventory.ts                # 재고 CRUD
│   │   ├── receiving.ts                # 입고
│   │   ├── stockCount.ts               # 실사
│   │   └── stockMovement.ts            # 이동 기록
│   ├── utils/
│   │   ├── priority.ts
│   │   ├── catchWeight.ts
│   │   ├── autoDispatch.ts
│   │   ├── stockCalculation.ts         # 재고 계산
│   │   └── fifoDeduction.ts            # FIFO 차감
│   └── hooks/
│       ├── useOrders.ts
│       ├── useProduction.ts
│       ├── useInventory.ts             # 재고 훅
│       └── useStockAlert.ts            # 알림 훅
│
├── types/
│   ├── order.ts
│   ├── production.ts
│   ├── release.ts
│   ├── dispatch.ts
│   ├── inventory.ts                    # 재고 타입
│   └── common.ts
│
└── messages/
    ├── ko.json
    ├── th.json
    ├── mm.json
    └── en.json
```

---

## 🔥 Firestore 데이터 구조

### 컬렉션 개요

```
firestore/
├── orders/              # 주문 (고객별)
├── order_items/         # 주문 품목
├── production_batches/  # 생산 배치 (부위별)
├── production_records/  # 생산 기록 (제품별)
├── releases/            # 출고 확인
├── dispatch_routes/     # 배차 루트
│
├── raw_stock/           # 원육 재고
├── product_stock/       # 완제품 재고
├── receiving/           # 입고 기록
├── stock_movements/     # 재고 이동 이력
├── stock_counts/        # 실사 기록
├── stock_adjustments/   # 재고 조정
│
├── vehicles/            # 차량 마스터
├── customers/           # 고객 마스터
├── products/            # 제품 마스터
├── suppliers/           # 공급처 마스터
└── warehouses/          # 창고 마스터
```

### 상세 스키마

```javascript
// ============================================
// 주문 관련 (기존)
// ============================================

// orders/{orderId} - 주문
{
  orderId: "ORD260105-001",
  customerId: "MT-0022",
  customerCode: "DB1",
  customerName: "다본푸드",
  deliveryDate: "2026-01-05",
  zone: "A7",
  timeConstraint: "09:00",
  itemCount: 3,
  totalWeight: 23.0,
  actualWeight: null,
  status: "producing",   // ordered → producing → produced → released → dispatched → delivered
  statusFlow: { ... },
  vehicleId: null,
  source: "line",
  createdAt: timestamp
}

// order_items/{itemId} - 주문 품목
{
  itemId: "ITEM260105-001-01",
  orderId: "ORD260105-001",
  customerId: "MT-0022",
  productId: "2-FP220001-T6",
  productName: "삼겹 6피스컷",
  category: "삼겹",
  orderedQty: 10,
  actualQty: null,
  unit: "kg",
  status: "pending",
  priority: 1,
  createdAt: timestamp
}

// ============================================
// 생산 관련 (기존)
// ============================================

// production_batches/{batchId} - 생산 배치
{
  batchId: "BATCH260105-삼겹",
  date: "2026-01-05",
  category: "삼겹",
  categoryName: { ko, th, mm, en },
  totalOrdered: 45.0,
  totalActual: 23.3,
  itemCount: 5,
  completedCount: 2,
  stockRequired: 50.0,
  stockAvailable: 120.0,
  stockSufficient: true,
  status: "in_progress",
  progress: 45,
  items: [...],
  createdAt: timestamp
}

// production_records/{recordId} - 생산 기록
{
  recordId: "PR260105-001",
  date: "2026-01-05",
  batchId: "BATCH260105-삼겹",
  orderId: "ORD260105-001",
  itemId: "ITEM260105-001-01",
  customerId: "MT-0022",
  productId: "2-FP220001-T6",
  productName: "삼겹 6피스컷",
  category: "삼겹",
  orderedQty: 10,
  actualQty: 10.1,
  unit: "kg",
  variance: 0.1,
  variancePercent: 1.0,
  isWithinTolerance: true,
  photoRequired: true,
  photo: "gs://...",
  photoUrl: "https://...",
  worker: "쏨차이",
  
  // 재고 연동 (신규)
  rawStockDeducted: [
    { stockId: "RAW260105-001", quantity: 11.1, lotNo: "L260104-001" }
  ],
  productStockCreated: "PSTK260105-001",
  
  createdAt: timestamp
}

// ============================================
// 출고/배차 관련 (기존)
// ============================================

// releases/{releaseId} - 출고 확인
{
  releaseId: "REL260105-001",
  date: "2026-01-05",
  orderId: "ORD260105-001",
  customerId: "MT-0022",
  items: [...],
  itemCount: 3,
  totalWeight: 23.3,
  photo: "gs://...",
  status: "released",
  releasedBy: "위타야",
  releasedAt: timestamp,
  
  // 재고 연동 (신규)
  productStockDeducted: [
    { stockId: "PSTK260105-001", quantity: 10.1 }
  ],
  
  createdAt: timestamp
}

// dispatch_routes/{routeId} - 배차 루트
{
  routeId: "ROUTE260105-V001",
  date: "2026-01-05",
  vehicleId: "V001",
  vehicleName: "차량1",
  driverName: "쏨차이",
  capacity: 500,
  stops: [...],
  totalStops: 8,
  totalWeight: 285,
  status: "pending",
  dispatchMethod: "auto",
  createdAt: timestamp
}

// ============================================
// 📦 재고 관련 (신규)
// ============================================

// raw_stock/{stockId} - 원육 재고
{
  stockId: "RAW260105-001",
  
  // 품목
  category: "삼겹",
  categoryName: { ko: "삼겹살", th: "สามชั้น", mm: "ဝက်ဗိုက်", en: "Pork Belly" },
  species: "pork",
  
  // 수량
  quantity: 120.5,
  unit: "kg",
  reservedQty: 30,
  availableQty: 90.5,
  
  // Lot
  lotNo: "L260104-001",
  receivedDate: "2026-01-04",
  expiryDate: "2026-01-10",
  daysToExpiry: 5,
  
  // 공급처
  supplierId: "SUP001",
  supplierName: "삼양축산",
  
  // 원가
  unitCost: 180,
  totalCost: 21690,
  
  // 위치
  warehouseId: "WH-A",
  warehouseName: "냉장고A",
  location: "선반-1",
  
  // 상태
  status: "available",   // available | reserved | expired | depleted
  
  // 신뢰도 (점진적 정확도용)
  dataSource: "receiving",   // legacy | receiving | counted
  confidence: 100,
  isLegacy: false,
  legacyNote: null,
  lastCountedAt: timestamp,
  
  // 입고 참조
  receivingId: "RCV260104-001",
  
  createdAt: timestamp,
  updatedAt: timestamp
}

// product_stock/{stockId} - 완제품 재고
{
  stockId: "PSTK260105-001",
  
  // 제품
  productId: "2-FP220001-T6",
  productCode: "2-FP220001-T6",
  productName: "삼겹 6피스컷",
  category: "삼겹",
  
  // 수량
  quantity: 10.1,
  unit: "kg",
  reservedQty: 10.1,      // 주문에 예약됨
  availableQty: 0,
  
  // 원가 (생산 시 계산)
  unitCost: 195,
  
  // 유통기한
  productionDate: "2026-01-05",
  expiryDate: "2026-01-08",
  
  // 생산 참조
  productionRecordId: "PR260105-001",
  orderId: "ORD260105-001",      // 특정 주문용
  customerId: "MT-0022",
  
  // 위치
  warehouseId: "WH-PROD",
  
  // 상태
  status: "reserved",     // available | reserved | released
  
  createdAt: timestamp,
  updatedAt: timestamp
}

// receiving/{receiveId} - 입고 기록
{
  receiveId: "RCV260105-001",
  date: "2026-01-05",
  
  // 공급처
  supplierId: "SUP001",
  supplierName: "삼양축산",
  
  // 품목
  items: [
    {
      category: "삼겹",
      quantity: 50,
      unit: "kg",
      unitCost: 180,
      totalCost: 9000,
      lotNo: "L260105-001",
      expiryDate: "2026-01-11",
      warehouseId: "WH-A",
      
      // 생성된 재고 참조
      stockId: "RAW260105-002"
    }
  ],
  
  // 합계
  totalWeight: 80,
  totalCost: 15000,
  
  // 문서
  invoiceNo: "INV-2026-001",
  invoicePhoto: "gs://...",
  
  // 상태
  status: "received",
  receivedBy: "쏨차이",
  receivedAt: timestamp,
  
  createdAt: timestamp
}

// stock_movements/{movementId} - 재고 이동 이력
{
  movementId: "MOV260105-001",
  date: "2026-01-05",
  
  // 이동 유형
  type: "production_out",
  // receive_in: 입고
  // production_out: 생산 소진 (원육-)
  // production_in: 생산 완료 (완제품+)
  // release_out: 출고 (완제품-)
  // count_adjust: 실사 조정
  // dispose: 폐기
  // transfer: 창고 이동
  
  // 품목
  stockType: "raw",       // raw | product
  stockId: "RAW260105-001",
  category: "삼겹",
  productId: null,
  lotNo: "L260104-001",
  
  // 수량
  quantity: -30,          // +입고, -출고
  beforeQty: 120.5,
  afterQty: 90.5,
  unit: "kg",
  
  // 위치
  warehouseId: "WH-A",
  
  // 관련 문서
  referenceType: "production_record",
  referenceId: "PR260105-001",
  
  // 메타
  reason: "삼겹 생산 소진",
  createdBy: "system",
  createdAt: timestamp
}

// stock_counts/{countId} - 실사 기록
{
  countId: "CNT260105-001",
  date: "2026-01-05",
  
  // 범위
  warehouseId: "WH-A",
  warehouseName: "냉장고A",
  countType: "full",       // full | partial | spot
  
  // 실사 결과
  items: [
    {
      stockId: "RAW260105-001",
      category: "삼겹",
      lotNo: "L260104-001",
      systemQty: 120.5,
      countedQty: 115.0,
      variance: -5.5,
      variancePercent: -4.6,
      action: "adjust",     // none | adjust | investigate
      note: "자연 감모"
    }
  ],
  
  // 요약
  totalItems: 5,
  matchedItems: 3,
  varianceItems: 2,
  totalVariance: -9.0,
  accuracyRate: 96.8,       // 정확도
  
  // 승인/적용
  status: "approved",       // draft | pending | approved | rejected
  adjustmentApplied: true,
  
  countedBy: "쏨차이",
  countedAt: timestamp,
  approvedBy: "Giu",
  approvedAt: timestamp,
  
  createdAt: timestamp
}

// stock_adjustments/{adjustId} - 재고 조정
{
  adjustId: "ADJ260105-001",
  date: "2026-01-05",
  
  // 품목
  stockType: "raw",
  stockId: "RAW260105-001",
  category: "삼겹",
  lotNo: "L260104-001",
  
  // 조정
  adjustType: "count",      // count | dispose | damage | transfer | other
  beforeQty: 120.5,
  adjustQty: -5.5,
  afterQty: 115.0,
  unit: "kg",
  
  // 원인
  reason: "실사 결과 조정",
  sourceType: "stock_count",
  sourceId: "CNT260105-001",
  
  // 증빙
  photo: "gs://...",
  
  // 승인
  status: "approved",
  requestedBy: "쏨차이",
  requestedAt: timestamp,
  approvedBy: "Giu",
  approvedAt: timestamp,
  
  createdAt: timestamp
}

// ============================================
// 마스터 데이터
// ============================================

// warehouses/{warehouseId} - 창고 마스터
{
  warehouseId: "WH-A",
  code: "A",
  name: "냉장고A",
  type: "refrigerator",     // refrigerator | freezer | processing | shipping
  
  // 온도
  temperatureMin: 0,
  temperatureMax: 4,
  
  // 실사 관리
  lastCountDate: "2026-01-05",
  nextCountDate: "2026-01-12",
  countCycle: 7,
  
  // 정확도
  accuracy: 85,
  
  // 담당자
  responsiblePerson: "쏨차이",
  
  isActive: true,
  createdAt: timestamp
}

// suppliers/{supplierId} - 공급처 마스터
{
  supplierId: "SUP001",
  code: "SY",
  name: "삼양축산",
  contact: "김사장",
  phone: "02-xxx-xxxx",
  paymentTerms: "월말 정산",
  categories: ["삼겹", "목살", "안심"],
  rating: 4.5,
  isActive: true,
  createdAt: timestamp
}

// products/{productId} - 제품 마스터 (확장)
{
  productId: "2-FP220001-T6",
  code: "2-FP220001-T6",
  name: { ko, th, mm, en },
  category: "삼겹",
  categoryName: { ko, th, mm, en },
  species: "pork",
  unit: "kg",
  isCatchWeight: true,
  
  // 원육 소요량 (재고 연동용)
  rawMaterialRatio: 1.1,    // 1kg 생산에 1.1kg 원육
  
  // 유통기한
  shelfLifeDays: 3,         // 생산 후 유통기한
  
  isActive: true,
  createdAt: timestamp
}

// customers/{customerId} - 고객 마스터 (확장)
{
  customerId: "MT-0022",
  code: "DB1",
  name: "다본푸드",
  zone: "A7",
  address: "...",
  timeConstraint: null,
  photoRequired: true,
  catchWeightTolerance: 3,
  isActive: true,
  createdAt: timestamp
}

// vehicles/{vehicleId} - 차량 마스터
{
  vehicleId: "V001",
  name: "차량1",
  plateNumber: "1กข 1234",
  type: "refrigerated",
  capacity: 500,
  driverId: "D001",
  driverName: "쏨차이",
  driverPhone: "081-xxx-xxxx",
  preferredZones: ["A", "B"],
  isActive: true,
  createdAt: timestamp
}
```

---

## 📊 화면별 기능 명세

### 메인 메뉴 구조

```
┌────────────────────────────────────────────────┐
│  Meet365 OPS                    [KO] [언어 ▼]  │
├────────────────────────────────────────────────┤
│                                                │
│  📋 주문       📦 재고       🚚 배송          │
│  ├ 주문접수   ├ 대시보드    ├ 출고대기        │
│  ├ 주문목록   ├ 원육재고    ├ 출고확인        │
│  └ 주문수정   ├ 완제품재고  └ 배차관리        │
│              ├ 입고등록                       │
│  🏭 생산     ├ 재고실사     📺 현황판        │
│  ├ 생산지시  ├ 재고조정    ├ 주문현황        │
│  └ 생산입력  └ 이력조회    ├ 생산현황        │
│                            ├ 배송현황        │
│              ⚙️ 설정       └ 재고현황        │
│              ├ 제품관리                      │
│              ├ 고객관리                      │
│              ├ 공급처관리                    │
│              └ 창고관리                      │
│                                                │
└────────────────────────────────────────────────┘
```

### 재고 관련 화면

#### 1. 재고 대시보드 (/inventory)

**필수 기능**
- [ ] 원육/완제품 재고 요약
- [ ] 정확도 게이지 (전체/창고별)
- [ ] 알림 (부족, 만료 임박, 실사 예정)
- [ ] 빠른 링크 (입고, 실사, 조정)

#### 2. 원육 재고 (/inventory/raw)

**필수 기능**
- [ ] 부위별 재고 목록
- [ ] 가용량 vs 예약량 표시
- [ ] 유통기한 임박 강조
- [ ] Legacy/신규 구분 표시
- [ ] Lot별 상세 보기

#### 3. 입고 등록 (/inventory/receive/new)

**필수 기능**
- [ ] 공급처 선택
- [ ] 품목별 수량/단가/유통기한 입력
- [ ] 창고 지정
- [ ] 송장 사진 촬영
- [ ] 자동 Lot 번호 생성
- [ ] 입고 완료 → 재고 자동 증가

#### 4. 재고 실사 (/inventory/count/new)

**필수 기능**
- [ ] 창고 선택
- [ ] 품목별 실사 수량 입력
- [ ] 시스템 vs 실사 비교
- [ ] 차이 자동 계산
- [ ] 조정 승인 요청
- [ ] 정확도 자동 업데이트

#### 5. 재고 조정 (/inventory/adjust)

**필수 기능**
- [ ] 조정 유형 선택 (실사/폐기/손상/이동)
- [ ] 사유 입력 (필수)
- [ ] 증빙 사진 (선택)
- [ ] 승인 프로세스

---

## 🔧 핵심 알고리즘

### 1. FIFO + Legacy 우선 차감

```typescript
async function deductRawStock(
  category: string,
  requiredQty: number
): Promise<DeductionResult[]> {
  // 1. 해당 부위 재고 조회
  const stocks = await getRawStocksByCategory(category);
  
  // 2. 정렬: Legacy 우선 → 유통기한 임박순
  const sorted = stocks
    .filter(s => s.availableQty > 0)
    .sort((a, b) => {
      // Legacy 먼저
      if (a.isLegacy && !b.isLegacy) return -1;
      if (!a.isLegacy && b.isLegacy) return 1;
      // 유통기한 임박순
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  
  // 3. 순차 차감
  const deductions: DeductionResult[] = [];
  let remaining = requiredQty;
  
  for (const stock of sorted) {
    if (remaining <= 0) break;
    
    const deductQty = Math.min(stock.availableQty, remaining);
    deductions.push({
      stockId: stock.stockId,
      lotNo: stock.lotNo,
      quantity: deductQty,
      isLegacy: stock.isLegacy
    });
    
    remaining -= deductQty;
  }
  
  // 4. 부족 시 경고
  if (remaining > 0) {
    throw new InsufficientStockError(category, remaining);
  }
  
  return deductions;
}
```

### 2. 정확도 계산

```typescript
function calculateAccuracy(countResult: StockCount): number {
  const { items } = countResult;
  
  let totalSystem = 0;
  let totalVariance = 0;
  
  for (const item of items) {
    totalSystem += item.systemQty;
    totalVariance += Math.abs(item.variance);
  }
  
  if (totalSystem === 0) return 100;
  
  const accuracy = ((totalSystem - totalVariance) / totalSystem) * 100;
  return Math.max(0, Math.round(accuracy * 10) / 10);
}
```

### 3. 재고 부족 알림

```typescript
async function checkStockAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // 1. 유통기한 임박 (2일 이내)
  const expiringStocks = await getExpiringStocks(addDays(today, 2));
  for (const stock of expiringStocks) {
    alerts.push({
      type: 'expiry',
      severity: stock.daysToExpiry <= 1 ? 'critical' : 'warning',
      message: `${stock.category} ${stock.quantity}kg - ${stock.daysToExpiry}일 후 만료`,
      stockId: stock.stockId
    });
  }
  
  // 2. 재고 부족 (오늘 주문 대비)
  const todayOrders = await getTodayOrdersByCategory();
  for (const [category, orderQty] of Object.entries(todayOrders)) {
    const available = await getAvailableQtyByCategory(category);
    if (available < orderQty) {
      alerts.push({
        type: 'shortage',
        severity: 'critical',
        message: `${category} - 주문 ${orderQty}kg, 가용 ${available}kg (부족 ${orderQty - available}kg)`,
        category
      });
    }
  }
  
  // 3. 실사 예정
  const dueWarehouses = await getWarehousesDueForCount();
  for (const wh of dueWarehouses) {
    alerts.push({
      type: 'count_due',
      severity: 'info',
      message: `${wh.name} - 실사 예정일: ${wh.nextCountDate}`,
      warehouseId: wh.warehouseId
    });
  }
  
  return alerts;
}
```

---

## 🏃 개발 일정 (확장)

### Week 1: 핵심 기능

| Day | 작업 |
|:---:|------|
| 1 | 프로젝트 셋업, 주문접수, 주문현황판 |
| 2 | 생산지시, 생산입력 |
| 3 | 출고확인, 배차관리 |
| 4 | **재고 대시보드, 원육재고 목록** |
| 5 | **입고 등록, 재고-생산 연동** |

### Week 2: 재고 고도화

| Day | 작업 |
|:---:|------|
| 1 | **재고 실사 (창고별)** |
| 2 | **재고 조정, 승인 프로세스** |
| 3 | **재고 이력, 알림 시스템** |
| 4 | 재고 현황판 (모니터용) |
| 5 | 테스트, 배포, Legacy 초기 데이터 |

---

## 📝 점진적 도입 체크리스트

### Phase 1 (1-2주)

- [ ] 시스템 배포
- [ ] 기존 재고 Legacy로 등록 (추정값)
- [ ] 입고 기록 시작
- [ ] 창고 마스터 설정
- [ ] 실사 일정 수립

### Phase 2 (3-4주)

- [ ] 창고A 실사 완료
- [ ] 창고B 실사 완료
- [ ] 생산-재고 자동 연동 검증
- [ ] 일일 알림 확인 루틴

### Phase 3 (5-8주)

- [ ] 전체 창고 실사 완료
- [ ] Legacy 재고 대부분 소진
- [ ] 정확도 85% 달성
- [ ] 예외 케이스 정리

### Phase 4 (9주+)

- [ ] 정확도 95% 유지
- [ ] 주간 Spot 실사 정착
- [ ] KPI 모니터링 정착
- [ ] B2C 확장 준비 (POSPOS 연동)

---

## 🔗 참고

- Firebase 프로젝트: meet365-12ce8
- 기존 주문 시스템: meet365-order
- 기획 문서: meet365_production_record_system_v1_2.md

---

#meet365 #통합운영 #재고관리 #점진적실사 #CatchWeight #다국어
