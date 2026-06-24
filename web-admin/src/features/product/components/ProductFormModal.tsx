import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { ProductService } from '../services/product.service';
import type { Product, CreateProductPayload, UpdateProductPayload, FormData } from '../types/product.types';

interface ProductFormModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  product,
  onClose,
  onSuccess // FIX 1: Lấy onSuccess ra để sử dụng
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    category: 'racket',
    description: '',
    thumbnail_url: '',

    sku: '',
    price_cents: 0,

    size: '',
    color: '',

    hasVariants: false,
    variants: []
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        category: product.category as FormData['category'] || 'racket',
        description: product.description || '',
        thumbnail_url: product.thumbnail_url || '',

        sku: '',
        price_cents: 0,

        size: '',
        color: '',

        hasVariants: false,
        variants: []
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        category: 'racket',
        description: '',
        thumbnail_url: '',

        sku: '',
        price_cents: 0,

        size: '',
        color: '',

        hasVariants: false,
        variants: []
      });
    }
  }, [open, product]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: !product ? generateSlug(newName) : prev.slug
    }));
  };

  const generateSlug = (str: string) => {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) {
      if (!formData.hasVariants && (!formData.sku.trim() || formData.price_cents <= 0)) {
        message.error('Vui lòng nhập SKU và giá bán hợp lệ');
        return;
      }
    }

    try {
      setLoading(true);

      if (product) {
        const payload: UpdateProductPayload = {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url
        };
        await ProductService.updateProduct(product.id, payload);
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        const payload: CreateProductPayload = {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          variants: formData.hasVariants
            ? formData.variants
            : [
              {
                sku: formData.sku,
                price_cents: formData.price_cents,
                attributes: {}
              }
            ]
        };
        await ProductService.createProduct(payload);
        message.success('Tạo sản phẩm thành công!');
      }

      // FIX 2: Báo cho component cha biết là đã xong để load lại bảng & Đóng modal
      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      message.error(product ? 'Lỗi cập nhật sản phẩm' : 'Lỗi tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm transition-opacity p-4">
      <div className="bg-white border border-black rounded-lg shadow-xl w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {product ? 'Sửa thông tin Sản phẩm' : 'Thêm Sản Phẩm Mới'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 hidden-scrollbar">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: Vợt Yonex Astrox 99"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đường dẫn (Slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: vot-yonex-astrox-99"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                // FIX 3: Ép kiểu as FormData['category'] để không bị lỗi Type string
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FormData['category'] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="racket">Vợt Cầu Lông</option>
                <option value="shuttlecock">Quả Cầu Lông</option>
                <option value="shoes">Giày Cầu Lông</option>
                <option value="apparel">Quần Áo</option>
                <option value="accessory">Phụ Kiện</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Ảnh (Thumbnail URL)
              </label>
              <input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {!product && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Loại sản phẩm</label>
                <select
                  value={formData.hasVariants ? 'variant' : 'single'}
                  onChange={(e) => setFormData({ ...formData, hasVariants: e.target.value === 'variant' })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="single">Sản phẩm tiêu chuẩn</option>
                  <option value="variant">Sản phẩm có biến thể</option>
                </select>
              </div>

              {!formData.hasVariants && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>SKU</label>
                      <input
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sku: e.target.value
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label>Giá bán (VND)</label>
                      <input
                        type="number"
                        value={formData.price_cents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_cents: Number(e.target.value)
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Kích cỡ (Size)</label>

                      <input
                        value={formData.size}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            size: e.target.value
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="VD: 3U, 4U, 40, 41"
                      />
                    </div>

                    <div>
                      <label>Màu sắc</label>

                      <input
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            color: e.target.value
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="VD: Đỏ, Trắng"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Bỏ trống nếu sản phẩm không có thuộc tính này.
                  </p>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập chi tiết về thông số, công năng..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};