'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Edit2, Trash2, RefreshCw, Package } from 'lucide-react';
import { PageHeader, Button, Card, Input, Badge } from '@/components/ui';
import { getProducts, createProduct, updateProduct } from '@/lib/firestore/products';
import { Product, ProductInput, LocalizedText } from '@/types';

const SPECIES_OPTIONS = [
  { value: 'pork', label: '돼지' },
  { value: 'beef', label: '소' },
  { value: 'chicken', label: '닭' },
];

const CATEGORY_OPTIONS = [
  { value: 'samgyeop', label: '삼겹' },
  { value: 'moksal', label: '목살' },
  { value: 'ansim', label: '안심' },
  { value: 'deungsim', label: '등심' },
  { value: 'chadol', label: '차돌' },
  { value: 'anchang', label: '안창살' },
  { value: 'sogalbi', label: '소갈비' },
  { value: 'yukhoe', label: '육회' },
];

export default function ProductsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    nameKo: '',
    nameTh: '',
    nameMm: '',
    nameEn: '',
    category: '',
    categoryNameKo: '',
    species: 'pork',
    unit: 'kg',
    isCatchWeight: true,
    rawMaterialRatio: 1.1,
    shelfLifeDays: 3,
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      nameKo: '',
      nameTh: '',
      nameMm: '',
      nameEn: '',
      category: '',
      categoryNameKo: '',
      species: 'pork',
      unit: 'kg',
      isCatchWeight: true,
      rawMaterialRatio: 1.1,
      shelfLifeDays: 3,
      isActive: true,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code,
      nameKo: product.name.ko,
      nameTh: product.name.th || '',
      nameMm: product.name.mm || '',
      nameEn: product.name.en || '',
      category: product.category,
      categoryNameKo: product.categoryName.ko,
      species: product.species,
      unit: product.unit,
      isCatchWeight: product.isCatchWeight,
      rawMaterialRatio: product.rawMaterialRatio || 1.1,
      shelfLifeDays: product.shelfLifeDays || 3,
      isActive: product.isActive,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nameKo || !formData.category) {
      alert('코드, 이름(한국어), 카테고리는 필수입니다');
      return;
    }

    const name: LocalizedText = {
      ko: formData.nameKo,
      th: formData.nameTh || formData.nameKo,
      mm: formData.nameMm || formData.nameKo,
      en: formData.nameEn || formData.nameKo,
    };

    const categoryName: LocalizedText = {
      ko: formData.categoryNameKo,
      th: formData.categoryNameKo,
      mm: formData.categoryNameKo,
      en: formData.categoryNameKo,
    };

    const input: ProductInput = {
      code: formData.code,
      name,
      category: formData.category,
      categoryName,
      species: formData.species as 'pork' | 'beef' | 'chicken',
      unit: formData.unit,
      isCatchWeight: formData.isCatchWeight,
      rawMaterialRatio: formData.rawMaterialRatio,
      shelfLifeDays: formData.shelfLifeDays,
      isActive: formData.isActive,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.productId, input);
      } else {
        await createProduct(input);
      }
      await loadProducts();
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (product: Product) => {
    if (!confirm(`${product.name.ko}을(를) 비활성화 하시겠습니까?`)) return;

    try {
      await updateProduct(product.productId, { isActive: false });
      await loadProducts();
    } catch (error) {
      console.error('Failed to deactivate product:', error);
      alert('비활성화 실패');
    }
  };

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.categoryName.ko;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <PageHeader
          title="제품 관리"
          backHref={`/${locale}/settings`}
          actions={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              제품 추가
            </Button>
          }
        />

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">
                {editingProduct ? '제품 수정' : '신규 제품'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="제품 코드 *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="2-FP220001-T6"
                  disabled={!!editingProduct}
                />

                <Input
                  label="제품명 (한국어) *"
                  value={formData.nameKo}
                  onChange={(e) => setFormData({ ...formData, nameKo: e.target.value })}
                  placeholder="삼겹 6피스컷"
                />

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="태국어"
                    value={formData.nameTh}
                    onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                    placeholder="สามชั้น"
                  />
                  <Input
                    label="미얀마어"
                    value={formData.nameMm}
                    onChange={(e) => setFormData({ ...formData, nameMm: e.target.value })}
                  />
                  <Input
                    label="영어"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Pork Belly"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const cat = CATEGORY_OPTIONS.find(c => c.value === e.target.value);
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          categoryNameKo: cat?.label || '',
                        });
                      }}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">선택</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      축종
                    </label>
                    <select
                      value={formData.species}
                      onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                    >
                      {SPECIES_OPTIONS.map((sp) => (
                        <option key={sp.value} value={sp.value}>{sp.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      단위
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                    >
                      <option value="kg">kg</option>
                      <option value="ea">개</option>
                      <option value="pack">팩</option>
                    </select>
                  </div>
                  <Input
                    label="원육비율"
                    type="number"
                    step="0.01"
                    value={formData.rawMaterialRatio.toString()}
                    onChange={(e) => setFormData({ ...formData, rawMaterialRatio: parseFloat(e.target.value) || 1.1 })}
                  />
                  <Input
                    label="유통기한(일)"
                    type="number"
                    value={formData.shelfLifeDays.toString()}
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 3 })}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isCatchWeight}
                      onChange={(e) => setFormData({ ...formData, isCatchWeight: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">캐치웨이트</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    취소
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? '저장중...' : editingProduct ? '수정' : '추가'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Summary */}
        <Card padding="sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 {products.length}개 제품</span>
            <Button variant="ghost" size="sm" onClick={loadProducts}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </Card>

        {/* Product List by Category */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">등록된 제품이 없습니다</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              첫 제품 추가
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <Card key={category}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  {category}
                  <span className="text-sm font-normal text-gray-500">
                    ({categoryProducts.length}개)
                  </span>
                </h3>

                <div className="space-y-2">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name.ko}</span>
                          {product.isCatchWeight && (
                            <Badge color="yellow" size="sm">CW</Badge>
                          )}
                          <Badge
                            color={product.species === 'beef' ? 'red' : 'gray'}
                            size="sm"
                          >
                            {product.species === 'beef' ? '소' : '돼지'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{product.code}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{product.unit}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(product)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
