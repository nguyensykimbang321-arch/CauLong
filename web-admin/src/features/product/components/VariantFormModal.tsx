import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { ProductService } from '../services/product.service';
import type { ProductVariant } from '../types/product.types';

interface VariantFormModalProps {
  open: boolean;
  productId: number | null;
  variant?: ProductVariant; // Có truyền variant => Chế độ Sửa. Không có => Thêm mới
  onClose: () => void;
  onSuccess: () => void;
}

export const VariantFormModal: React.FC<VariantFormModalProps> = ({ 
  open, 
  productId, 
  variant, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    sku: '',
    price_cents: '', // Dùng string để dễ xử lý ô input rỗng
    size: '',
    color: ''
  });

  // Tự động điền dữ liệu nếu là sửa, làm sạch nếu thêm mới
  useEffect(() => {
    if (open) {
      if (variant) {
        // eslint-disable-next-line
        setFormData({
            sku: variant.sku || '',
            price_cents: variant.price_cents?.toString() || '',
            size: variant.attributes?.size ? String(variant.attributes.size) : '',
            color: variant.attributes?.color ? String(variant.attributes.color) : ''
        });
      } else {
        setFormData({
          sku: '',
          price_cents: '',
          size: '',
          color: ''
        });
      }
    }
  }, [open, variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    try {
      setLoading(true);

      // Đóng gói attributes (Loại bỏ các trường rỗng để tránh lưu rác vào DB)
      const attributes: Record<string, string> = {};
      if (formData.size.trim()) attributes.size = formData.size.trim();
      if (formData.color.trim()) attributes.color = formData.color.trim();

      if (variant) {
        // 🏸 CÚ ĐẬP 1: GỌI API SỬA BIẾN THỂ
        await ProductService.updateVariant(productId, variant.id, {
          sku: formData.sku,
          price_cents: Number(formData.price_cents),
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined
        });
        message.success('Cập nhật thông tin biến thể thành công!');
      } else {
        // 🏸 CÚ ĐẬP 2: GỌI API THÊM BIẾN THỂ (Lưu ý: API Backend nhận một mảng variants)
        await ProductService.addVariants(productId, {
          variants: [{
            sku: formData.sku,
            price_cents: Number(formData.price_cents),
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined
          }]
        });
        message.success('Thêm biến thể mới thành công!');
      }

      onSuccess();
    } catch (error) {
      message.error(variant ? 'Lỗi khi cập nhật biến thể!' : 'Lỗi khi thêm biến thể mới!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity p-4">
      {/* Khung Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in-up">
        
        {/* Nút X Đóng */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {variant ? 'Sửa thông tin Phân loại' : 'Thêm Phân loại (Size/Màu)'}
          </h3>
        </div>

        {/* Form Nhập Liệu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="flex gap-4">
            {/* Mã SKU */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="VD: YNX-99-4U-RED"
              />
            </div>

            {/* Giá bán */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.price_cents}
                onChange={(e) => setFormData({...formData, price_cents: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: 3500000"
              />
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {/* Thuộc tính Size */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích cỡ (Size)
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="VD: 3U, 4U, 40, 41"
              />
            </div>

            {/* Thuộc tính Màu sắc */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Màu sắc
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
                placeholder="VD: Đỏ, Trắng"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            * Bỏ trống Kích cỡ hoặc Màu sắc nếu sản phẩm không có thuộc tính này.
          </p>

          {/* Footer Nút bấm */}
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
              {loading ? 'Đang lưu...' : (variant ? 'Cập nhật' : 'Thêm Biến Thể')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};