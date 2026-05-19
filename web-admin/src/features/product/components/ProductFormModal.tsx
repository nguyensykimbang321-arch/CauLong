import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { ProductService } from '../services/product.service';
import type { Product, CreateProductPayload, UpdateProductPayload } from '../types/product.types';

interface ProductFormModalProps {
  open: boolean;
  product: Product | null; // Nếu null => Thêm mới. Có data => Sửa
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  open, 
  product, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'racket',
    description: '',
    thumbnail_url: ''
  });

  // Tự động điền dữ liệu nếu là chế độ SỬA, hoặc làm sạch form nếu THÊM MỚI
  useEffect(() => {
    if (open) {
      if (product) {
        // eslint-disable-next-line
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          category: product.category || 'racket',
          description: product.description || '',
          thumbnail_url: product.thumbnail_url || ''
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          category: 'racket',
          description: '',
          thumbnail_url: ''
        });
      }
    }
  }, [open, product]);

  // Hàm tự động tạo Slug từ Tên sản phẩm (Hỗ trợ tiếng Việt)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      // Tự động generate slug nếu đang ở chế độ Thêm mới
      slug: !product ? generateSlug(newName) : prev.slug
    }));
  };

  const generateSlug = (str: string) => {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^\w\s-]/g, '') // Bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Xóa gạch ngang thừa
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (product) {
        // Gọi API Cập nhật
        const payload: UpdateProductPayload = { ...formData };
        await ProductService.updateProduct(product.id, payload);
        message.success('Cập nhật thông tin sản phẩm thành công!');
      } else {
        // Gọi API Thêm mới
        const payload: CreateProductPayload = { ...formData };
        // Lưu ý: Đối với thêm mới, nếu muốn khởi tạo luôn 1 variant mặc định (Cho Danh sách 2), 
        // bạn có thể kẹp thêm mảng variants: [] vào payload ở đây.
        await ProductService.createProduct(payload);
        message.success('Thêm sản phẩm mới thành công!');
      }

      onSuccess();
    } catch (error) {
      message.error(product ? 'Lỗi khi cập nhật sản phẩm!' : 'Lỗi khi thêm sản phẩm!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity p-4">
      {/* Khung Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
        
        {/* Nút X (Đóng) */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {product ? 'Sửa thông tin Sản phẩm' : 'Thêm Sản Phẩm Mới'}
          </h3>
        </div>

        {/* Form Nhập Liệu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex flex-col md:flex-row gap-5">
            {/* Tên SP */}
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

            {/* Slug */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đường dẫn (Slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: vot-yonex-astrox-99"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* Danh mục */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="racket">Vợt Cầu Lông</option>
                <option value="shuttlecock">Quả Cầu Lông</option>
                <option value="shoes">Giày Cầu Lông</option>
                <option value="apparel">Quần Áo</option>
                <option value="accessory">Phụ Kiện</option>
              </select>
            </div>

            {/* Ảnh đại diện */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Ảnh (Thumbnail URL)
              </label>
              <input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập chi tiết về thông số, công năng..."
            ></textarea>
          </div>

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
              {loading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};