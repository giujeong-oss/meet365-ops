import { ProductOption } from '@/types';

export interface ParsedItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  matched: boolean;
  originalText: string;
}

/**
 * 주문 메시지를 파싱하여 품목 목록 추출
 *
 * 지원 형식:
 * - "삼겹 6피스컷 10kg"
 * - "삼겹6피스 10"
 * - "목살 슬라이스 5kg"
 * - "차돌 3"
 * - 여러 줄 입력 지원
 */
export function parseOrderMessage(
  message: string,
  products: ProductOption[]
): ParsedItem[] {
  const lines = message
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: ParsedItem[] = [];

  for (const line of lines) {
    const parsed = parseLine(line, products);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

function parseLine(line: string, products: ProductOption[]): ParsedItem | null {
  // 수량 추출 (숫자 + optional kg/키로/개)
  const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(kg|키로|킬로|개)?/i);
  if (!qtyMatch) return null;

  const quantity = parseFloat(qtyMatch[1]);
  if (quantity <= 0) return null;

  // 수량 부분 제거하고 제품명 추출
  const productText = line
    .replace(/(\d+(?:\.\d+)?)\s*(kg|키로|킬로|개)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!productText) return null;

  // 제품 매칭
  console.log('Parsing:', { line, productText, quantity, productsCount: products.length });
  const matchedProduct = findBestMatch(productText, products);
  console.log('Match result:', matchedProduct?.name || 'no match');

  return {
    productId: matchedProduct?.productId || '',
    productName: matchedProduct?.name || productText,
    quantity,
    unit: matchedProduct?.unit || 'kg',
    matched: !!matchedProduct,
    originalText: line,
  };
}

function findBestMatch(text: string, products: ProductOption[]): ProductOption | null {
  const normalizedText = normalizeText(text);

  // 1. 정확한 이름 매칭
  for (const product of products) {
    if (normalizeText(product.name) === normalizedText) {
      return product;
    }
  }

  // 2. 포함 매칭 (제품명이 입력에 포함)
  let bestMatch: ProductOption | null = null;
  let bestScore = 0;

  for (const product of products) {
    const productName = normalizeText(product.name);
    const categoryName = normalizeText(product.categoryName);

    // 점수 계산
    let score = 0;

    // 제품명 전체 포함
    if (normalizedText.includes(productName)) {
      score += productName.length * 2;
    }

    // 카테고리 포함
    if (normalizedText.includes(categoryName)) {
      score += categoryName.length;
    }

    // 키워드 매칭
    const keywords = extractKeywords(productName);
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // 최소 점수 이상일 때만 반환
  return bestScore >= 2 ? bestMatch : null;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣]/g, '');
}

function extractKeywords(text: string): string[] {
  // 공백으로 분리하고 각 단어를 키워드로
  return text
    .split(/\s+/)
    .map((word) => normalizeText(word))
    .filter((word) => word.length >= 2);
}
